import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it, before, after } from "node:test";
import bcrypt from "bcryptjs";

// src/config/env.js freezes its config on first import (from process.env,
// via dotenv). Setting GITHUB_* here — before any local module is
// imported, even transitively — is what makes github.client.js see them
// as configured for this test file's process. This must stay a dynamic
// import block below: static `import` declarations are hoisted and would
// evaluate (and freeze env) before these assignments ever ran.
process.env.GITHUB_TOKEN = "test-token";
process.env.GITHUB_OWNER = "avenor-test";
process.env.GITHUB_REPO = "test-repo";
process.env.GITHUB_DEFAULT_BRANCH = "main";

const prisma = (await import("../src/config/prisma.js")).default;
const client = await import("../src/integrations/github/github.client.js");
const { createIncidentPullRequest } = await import("../src/integrations/github/github.service.js");
const { listEvents } = await import("../src/modules/investigation/incident-event.service.js");
const { encrypt } = await import("../src/utils/encryption.js");

const originalFetch = globalThis.fetch;

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

/** Routes api.github.com calls to `handler`, passes everything else through untouched. */
function mockGitHub(handler) {
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    if (typeof url === "string" && url.startsWith("https://api.github.com")) {
      calls.push({ url, method: opts?.method ?? "GET", body: opts?.body ? JSON.parse(opts.body) : undefined });
      return handler(url, opts, calls);
    }
    return originalFetch(url, opts);
  };
  return calls;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function happyPathHandler(url, opts) {
  const method = opts?.method ?? "GET";
  if (method === "GET" && url.includes("/git/ref/heads/")) return jsonResponse(200, { object: { sha: "base-sha-123" } });
  if (method === "POST" && url.includes("/git/refs")) return jsonResponse(201, { ref: "refs/heads/avenor/incident-xxx" });
  if (method === "GET" && url.includes("/contents/")) return jsonResponse(404, { message: "Not Found" });
  if (method === "PUT" && url.includes("/contents/")) return jsonResponse(201, { content: { sha: "file-sha-456" } });
  if (method === "POST" && url.includes("/pulls")) return jsonResponse(201, { number: 42, html_url: "https://github.com/avenor-test/test-repo/pull/42" });
  throw new Error(`Unexpected GitHub call: ${method} ${url}`);
}

describe("GitHub Integration (Phase 3)", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured" }, () => {
  let user, project, workspace;

  before(async () => {
    const suffix = randomUUID().slice(0, 8);
    user = await prisma.user.create({ data: { name: "GitHub Test", email: `gh-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    project = await prisma.project.create({ data: { name: `GH Proj ${suffix}`, slug: `gh-proj-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `GH WS ${suffix}`, slug: `gh-ws-${suffix}`, ownerId: user.id } });
  });

  after(async () => {
    restoreFetch();
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  async function mkApprovedIncident() {
    return prisma.dataIncident.create({
      data: {
        projectId: project.id,
        workspaceId: workspace.id,
        title: "Orders schema incident",
        fixApprovalStatus: "APPROVED",
        evidence: { rootCause: { type: "COLUMN_REMOVED", description: "customer_status was removed from orders", confidence: 0.85 } },
        impact: { summary: { totalAffected: 1 }, categories: { dashboards: 1, datasets: 0, mlModels: 0, pipelines: 0 }, assets: [] },
        proposedFix: {
          status: "PROPOSED",
          fixType: "COLUMN_REMOVED",
          summary: "Backfill customer_status with a default value.",
          sql: 'SELECT * FROM "orders";',
          tests: ["t1"],
          files: [{ path: "models/orders.sql", content: 'SELECT * FROM "orders";' }],
          explanation: "...",
          risk: "HIGH",
        },
      },
    });
  }

  it("rejects PR creation when the fix has not been approved", async () => {
    const incident = await prisma.dataIncident.create({ data: { projectId: project.id, workspaceId: workspace.id, title: "Unapproved incident", proposedFix: { fixType: "COLUMN_REMOVED", sql: "SELECT 1;" }, fixApprovalStatus: "PROPOSED" } });
    await assert.rejects(() => createIncidentPullRequest(incident.id, user.id), /explicitly approved/);
  });

  it("creates a branch from the default branch's HEAD sha", async () => {
    const incident = await mkApprovedIncident();
    const calls = mockGitHub(happyPathHandler);
    try {
      await createIncidentPullRequest(incident.id, user.id);
      const createRef = calls.find((c) => c.method === "POST" && c.url.includes("/git/refs"));
      assert.ok(createRef, "expected a create-ref call");
      assert.equal(createRef.body.sha, "base-sha-123");
      assert.equal(createRef.body.ref, `refs/heads/avenor/incident-${incident.id.slice(0, 8)}`);
    } finally {
      restoreFetch();
    }
  });

  it("generates and commits the proposed fix's files as base64 content", async () => {
    const incident = await mkApprovedIncident();
    const calls = mockGitHub(happyPathHandler);
    try {
      await createIncidentPullRequest(incident.id, user.id);
      const putCall = calls.find((c) => c.method === "PUT" && c.url.includes("models%2Forders.sql"));
      assert.ok(putCall, "expected a commit (PUT contents) call for models/orders.sql");
      const decoded = Buffer.from(putCall.body.content, "base64").toString("utf8");
      assert.equal(decoded, 'SELECT * FROM "orders";');
      assert.equal(putCall.body.branch, `avenor/incident-${incident.id.slice(0, 8)}`);
    } finally {
      restoreFetch();
    }
  });

  it("opens a pull request whose body includes root cause, impact, and risk, and stores PR metadata + logs events", async () => {
    const incident = await mkApprovedIncident();
    const calls = mockGitHub(happyPathHandler);
    try {
      const result = await createIncidentPullRequest(incident.id, user.id);
      assert.equal(result.prNumber, 42);
      assert.equal(result.prUrl, "https://github.com/avenor-test/test-repo/pull/42");

      const prCall = calls.find((c) => c.method === "POST" && c.url.includes("/pulls"));
      assert.equal(prCall.body.title, "fix: resolve Orders schema incident incident");
      assert.ok(prCall.body.body.includes("customer_status was removed"));
      assert.ok(prCall.body.body.includes("Risk: HIGH"));
      assert.ok(prCall.body.body.includes("1 dashboard(s)"));

      const stored = await prisma.dataIncident.findUnique({ where: { id: incident.id } });
      assert.equal(stored.githubPr.prNumber, 42);
      assert.equal(stored.githubPr.fullName, "avenor-test/test-repo");
      // Phase 4A: opening a PR is a proposal becoming reviewable, not a
      // resolution — the incident only resolves once GitHub confirms
      // (via the webhook) that the PR was actually merged.
      assert.equal(stored.fixApprovalStatus, "PR_CREATED");
      assert.notEqual(stored.status, "RESOLVED");

      const events = await listEvents(incident.id);
      assert.ok(events.some((e) => e.type === "GITHUB_BRANCH_CREATED"));
      assert.ok(events.some((e) => e.type === "GITHUB_PR_CREATED"));
      assert.ok(!events.some((e) => e.type === "INCIDENT_RESOLVED"));
    } finally {
      restoreFetch();
    }
  });

  it("propagates a GitHub API failure as a clear error without crashing", async () => {
    const incident = await mkApprovedIncident();
    mockGitHub((url, opts) => {
      if ((opts?.method ?? "GET") === "GET" && url.includes("/git/ref/heads/")) return jsonResponse(500, { message: "Internal Server Error" });
      throw new Error(`Unexpected call: ${url}`);
    });
    try {
      await assert.rejects(() => createIncidentPullRequest(incident.id, user.id), /GitHub API request failed \(500/);
      const stored = await prisma.dataIncident.findUnique({ where: { id: incident.id } });
      assert.equal(stored.fixApprovalStatus, "APPROVED", "a failed PR attempt must not silently advance the fix state");
    } finally {
      restoreFetch();
    }
  });

  it("client.isConfigured() reports true once GITHUB_TOKEN/OWNER/REPO are set", () => {
    assert.equal(client.isConfigured(), true);
  });

  it("prefers a project's connected GitHub repository over the global env fallback", async () => {
    const connection = await prisma.gitHubConnection.create({
      data: { userId: user.id, githubUserId: `priority-${randomUUID()}`, githubLogin: "project-owner", encryptedAccessToken: encrypt("project-scoped-token"), status: "ACTIVE" },
    });
    const repository = await prisma.gitHubRepository.create({
      data: { connectionId: connection.id, githubRepositoryId: String(Date.now()), owner: "project-org", name: "project-repo", fullName: "project-org/project-repo", defaultBranch: "develop", htmlUrl: "https://github.com/project-org/project-repo" },
    });
    await prisma.project.update({ where: { id: project.id }, data: { githubRepositoryId: repository.id, githubBranch: "develop" } });

    const incident = await mkApprovedIncident();
    const calls = mockGitHub((url, opts) => {
      const method = opts?.method ?? "GET";
      // Every call must target the PROJECT's repo, never the global env one.
      assert.ok(url.includes("/repos/project-org/project-repo/"), `expected project-scoped repo path, got: ${url}`);
      assert.equal(opts.headers.authorization, "Bearer project-scoped-token");
      if (method === "GET" && url.includes("/git/ref/heads/develop")) return jsonResponse(200, { object: { sha: "project-sha" } });
      if (method === "POST" && url.includes("/git/refs")) return jsonResponse(201, {});
      if (method === "GET" && url.includes("/contents/")) return jsonResponse(404, {});
      if (method === "PUT" && url.includes("/contents/")) return jsonResponse(201, {});
      if (method === "POST" && url.includes("/pulls")) return jsonResponse(201, { number: 7, html_url: "https://github.com/project-org/project-repo/pull/7" });
      throw new Error(`Unexpected call: ${method} ${url}`);
    });
    try {
      const result = await createIncidentPullRequest(incident.id, user.id);
      assert.equal(result.prUrl, "https://github.com/project-org/project-repo/pull/7");
      assert.ok(calls.length > 0);
    } finally {
      restoreFetch();
      await prisma.project.update({ where: { id: project.id }, data: { githubRepositoryId: null } });
      await prisma.gitHubConnection.delete({ where: { id: connection.id } });
    }
  });
});
