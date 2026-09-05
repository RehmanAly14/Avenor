import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

// env.js freezes its config from process.env on first import (anywhere in
// the module graph). These must be set before any local module — even
// transitively — is imported, so this stays a dynamic-import file: static
// `import` declarations are hoisted and would evaluate first regardless of
// source order.
process.env.GITHUB_CLIENT_ID = "test-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-client-secret";

const prisma = (await import("../src/config/prisma.js")).default;
const app = (await import("../src/app.js")).default;
const { signToken } = await import("../src/utils/jwt.js");
const { decrypt } = await import("../src/utils/encryption.js");

const originalFetch = globalThis.fetch;

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

function mockGitHub({ profile, repos } = {}) {
  globalThis.fetch = async (url, opts) => {
    const method = opts?.method ?? "GET";
    if (typeof url === "string" && url.startsWith("https://github.com/login/oauth/access_token")) {
      return jsonResponse(200, { access_token: "gh-oauth-token-abc123", token_type: "bearer", scope: "repo,read:user" });
    }
    if (typeof url === "string" && url === "https://api.github.com/user" && method === "GET") {
      return jsonResponse(200, profile ?? { id: 999, login: "octocat", avatar_url: "https://gh.example/a.png", name: "Octocat", html_url: "https://github.com/octocat", public_repos: 3 });
    }
    if (typeof url === "string" && url.startsWith("https://api.github.com/user/repos")) {
      return jsonResponse(200, repos ?? []);
    }
    if (typeof url === "string" && url.startsWith("https://api.github.com") || (typeof url === "string" && url.startsWith("https://github.com"))) {
      throw new Error(`Unexpected GitHub call: ${method} ${url}`);
    }
    return originalFetch(url, opts);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

async function request(path, { method = "GET", token, body } = {}) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function extractState(authorizeUrl) {
  return new URL(authorizeUrl).searchParams.get("state");
}

describe("GitHub Connection (Phase 4A)", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured" }, () => {
  let userA, tokenA, userB, tokenB, project;

  before(async () => {
    const suffix = randomUUID().slice(0, 8);
    userA = await prisma.user.create({ data: { name: "Connector A", email: `conn-a-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    userB = await prisma.user.create({ data: { name: "Connector B", email: `conn-b-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    tokenA = signToken({ userId: userA.id, email: userA.email });
    tokenB = signToken({ userId: userB.id, email: userB.email });
    project = await prisma.project.create({ data: { name: `GH Connect Proj ${suffix}`, slug: `gh-connect-proj-${suffix}`, ownerId: userA.id } });
  });

  after(async () => {
    restoreFetch();
    await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
  });

  it("GET /github/connect requires authentication", async () => {
    const res = await request("/api/v1/github/connect");
    assert.equal(res.status, 401);
  });

  it("GET /github/connect returns a GitHub authorize URL bound to a fresh, server-stored state", async () => {
    const res = await request("/api/v1/github/connect", { token: tokenA });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.url.startsWith("https://github.com/login/oauth/authorize"));
    const state = extractState(res.body.data.url);
    assert.ok(state && state.length >= 32);
    const stored = await prisma.gitHubOAuthState.findUnique({ where: { state } });
    assert.equal(stored.userId, userA.id);
    assert.equal(stored.usedAt, null);
  });

  it("rejects a callback with an unknown/invalid state", async () => {
    mockGitHub();
    const res = await request("/api/v1/github/callback?code=whatever&state=not-a-real-state");
    restoreFetch();
    assert.equal(res.status, 400);
  });

  it("rejects a callback with an expired state", async () => {
    const expired = await prisma.gitHubOAuthState.create({ data: { state: randomUUID(), userId: userA.id, expiresAt: new Date(Date.now() - 1000) } });
    mockGitHub();
    const res = await request(`/api/v1/github/callback?code=whatever&state=${expired.state}`);
    restoreFetch();
    assert.equal(res.status, 400);
  });

  it("completes the OAuth flow, encrypts the token at rest, and never returns it", async () => {
    const connectRes = await request("/api/v1/github/connect", { token: tokenA });
    const state = extractState(connectRes.body.data.url);

    mockGitHub({ profile: { id: 555, login: "octo-a", avatar_url: "https://gh.example/a.png", name: "Octo A", html_url: "https://github.com/octo-a", public_repos: 2 } });
    const callbackRes = await request(`/api/v1/github/callback?code=abc123&state=${state}`);
    restoreFetch();

    assert.equal(callbackRes.status, 200);
    assert.equal(callbackRes.body.data.connection.githubLogin, "octo-a");
    assert.equal(JSON.stringify(callbackRes.body).includes("gh-oauth-token"), false, "response must never contain the raw access token");
    assert.equal(JSON.stringify(callbackRes.body).includes("encryptedAccessToken"), false);

    const stored = await prisma.gitHubConnection.findUnique({ where: { userId_githubUserId: { userId: userA.id, githubUserId: "555" } } });
    assert.ok(stored);
    assert.notEqual(stored.encryptedAccessToken, "gh-oauth-token-abc123");
    assert.equal(decrypt(stored.encryptedAccessToken), "gh-oauth-token-abc123");
  });

  it("rejects reusing an already-consumed state (single-use)", async () => {
    const connectRes = await request("/api/v1/github/connect", { token: tokenA });
    const state = extractState(connectRes.body.data.url);
    mockGitHub({ profile: { id: 555, login: "octo-reuse" } });
    const first = await request(`/api/v1/github/callback?code=abc&state=${state}`);
    assert.equal(first.status, 200);
    const second = await request(`/api/v1/github/callback?code=abc&state=${state}`);
    restoreFetch();
    assert.equal(second.status, 400);
  });

  it("reconnecting the same GitHub account updates the existing connection instead of duplicating it", async () => {
    const connectRes = await request("/api/v1/github/connect", { token: tokenA });
    const state = extractState(connectRes.body.data.url);
    mockGitHub({ profile: { id: 555, login: "octo-a-renamed", avatar_url: "https://gh.example/new.png" } });
    await request(`/api/v1/github/callback?code=abc&state=${state}`);
    restoreFetch();

    const rows = await prisma.gitHubConnection.findMany({ where: { userId: userA.id, githubUserId: "555" } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].githubLogin, "octo-a-renamed");
  });

  it("GET /github/status reflects only the requesting user's own connection", async () => {
    const statusA = await request("/api/v1/github/status", { token: tokenA });
    assert.equal(statusA.body.data.connected, true);
    assert.equal(statusA.body.data.githubLogin, "octo-a-renamed");

    const statusB = await request("/api/v1/github/status", { token: tokenB });
    assert.equal(statusB.body.data.connected, false);
  });

  it("GET /github/account fetches live profile data through the stored connection", async () => {
    mockGitHub({ profile: { id: 555, login: "octo-a-renamed", name: "Octo A", avatar_url: "https://gh.example/new.png", html_url: "https://github.com/octo-a", public_repos: 7 } });
    const res = await request("/api/v1/github/account", { token: tokenA });
    restoreFetch();
    assert.equal(res.status, 200);
    assert.equal(res.body.data.login, "octo-a-renamed");
    assert.equal(res.body.data.publicRepos, 7);
  });

  it("GET /github/account fails for a user with no connection, without crashing", async () => {
    const res = await request("/api/v1/github/account", { token: tokenB });
    assert.equal(res.status, 422);
  });

  let repositoryId;

  it("GET /github/repositories discovers and normalizes repositories, and is idempotent on repeat calls", async () => {
    const rawRepos = [
      { id: 111, owner: { login: "acme" }, name: "analytics", full_name: "acme/analytics", private: true, default_branch: "main", html_url: "https://github.com/acme/analytics", permissions: { pull: true, push: true, admin: false } },
      { id: 222, owner: { login: "acme" }, name: "public-site", full_name: "acme/public-site", private: false, default_branch: "master", html_url: "https://github.com/acme/public-site", permissions: { pull: true, push: false, admin: false } },
    ];
    mockGitHub({ repos: rawRepos });
    const first = await request("/api/v1/github/repositories", { token: tokenA });
    assert.equal(first.status, 200);
    assert.equal(first.body.data.repositories.length, 2);
    const analytics = first.body.data.repositories.find((r) => r.fullName === "acme/analytics");
    assert.equal(analytics.private, true);
    assert.equal(analytics.defaultBranch, "main");
    assert.deepEqual(analytics.permissions, { pull: true, push: true, admin: false });
    repositoryId = analytics.id;

    // Repeat discovery must not create duplicate rows for the same GitHub repo.
    const second = await request("/api/v1/github/repositories", { token: tokenA });
    restoreFetch();
    assert.equal(second.body.data.repositories.length, 2);
    const stored = await prisma.gitHubRepository.findMany({ where: { githubRepositoryId: "111" } });
    assert.equal(stored.length, 1);
  });

  it("blocks a user from listing another user's repositories (no connection = empty, not another user's data)", async () => {
    const res = await request("/api/v1/github/repositories", { token: tokenB });
    assert.equal(res.status, 422); // no connection for user B at all
  });

  it("POST /github/repositories/:id/select links a repository to a project the user owns", async () => {
    const res = await request(`/api/v1/github/repositories/${repositoryId}/select`, { method: "POST", token: tokenA, body: { projectId: project.id } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.project.githubRepository.fullName, "acme/analytics");
    assert.equal(res.body.data.project.githubBranch, "main");

    const updated = await prisma.project.findUnique({ where: { id: project.id } });
    assert.equal(updated.githubRepositoryId, repositoryId);
  });

  it("prevents a user from selecting a repository they don't own into any project (ID guessing)", async () => {
    const ownProjectForB = await prisma.project.create({ data: { name: "B's project", slug: `b-project-${randomUUID().slice(0, 8)}`, ownerId: userB.id } });
    const res = await request(`/api/v1/github/repositories/${repositoryId}/select`, { method: "POST", token: tokenB, body: { projectId: ownProjectForB.id } });
    assert.equal(res.status, 404);
  });

  it("prevents a user from linking their own repository to a project they don't own", async () => {
    const otherProject = await prisma.project.create({ data: { name: "Someone else's", slug: `other-project-${randomUUID().slice(0, 8)}`, ownerId: userB.id } });
    const res = await request(`/api/v1/github/repositories/${repositoryId}/select`, { method: "POST", token: tokenA, body: { projectId: otherProject.id } });
    assert.equal(res.status, 403);
  });

  it("DELETE /github/connection disconnects and clears the project's linked repository", async () => {
    const res = await request("/api/v1/github/connection", { method: "DELETE", token: tokenA });
    assert.equal(res.status, 200);

    const statusAfter = await request("/api/v1/github/status", { token: tokenA });
    assert.equal(statusAfter.body.data.connected, false);

    const projectAfter = await prisma.project.findUnique({ where: { id: project.id } });
    assert.equal(projectAfter.githubRepositoryId, null);

    const remainingRepos = await prisma.gitHubRepository.findMany({ where: { githubRepositoryId: { in: ["111", "222"] } } });
    assert.equal(remainingRepos.length, 0);
  });
});
