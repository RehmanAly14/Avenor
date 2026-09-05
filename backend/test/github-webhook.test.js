import crypto from "node:crypto";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

// Same env-freezing constraint as the other GitHub test files — set
// before any local module is imported, even transitively.
process.env.GITHUB_WEBHOOK_SECRET = "test-webhook-secret";

const prisma = (await import("../src/config/prisma.js")).default;
const app = (await import("../src/app.js")).default;
const webhook = await import("../src/integrations/github/github.webhook.js");
const { listEvents } = await import("../src/modules/investigation/incident-event.service.js");

function sign(body) {
  return `sha256=${crypto.createHmac("sha256", "test-webhook-secret").update(body).digest("hex")}`;
}

async function postWebhook(payload, { signature, event = "pull_request" } = {}) {
  const body = JSON.stringify(payload);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/github/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-github-event": event, "x-hub-signature-256": signature ?? sign(body) },
      body,
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

describe("GitHub Webhook (Phase 4A)", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured" }, () => {
  it("isWebhookConfigured() is true once GITHUB_WEBHOOK_SECRET is set", () => {
    assert.equal(webhook.isWebhookConfigured(), true);
  });

  it("verifySignature accepts a correctly signed payload", () => {
    const body = Buffer.from(JSON.stringify({ hello: "world" }));
    assert.equal(webhook.verifySignature(body, sign(body)), true);
  });

  it("verifySignature rejects a tampered payload", () => {
    const body = Buffer.from(JSON.stringify({ hello: "world" }));
    const signatureForDifferentBody = sign(Buffer.from(JSON.stringify({ hello: "tampered" })));
    assert.equal(webhook.verifySignature(body, signatureForDifferentBody), false);
  });

  it("verifySignature rejects a missing signature", () => {
    assert.equal(webhook.verifySignature(Buffer.from("{}"), undefined), false);
  });

  it("rejects an HTTP request with an invalid signature", async () => {
    const res = await postWebhook({ action: "closed", pull_request: { number: 1, merged: true }, repository: { full_name: "acme/repo" } }, { signature: "sha256=deadbeef" });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("rejects a malformed payload gracefully instead of crashing", async () => {
    const body = JSON.stringify({ not: "a real pull_request payload" });
    const server = createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/github/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-github-event": "pull_request", "x-hub-signature-256": sign(body) },
        body,
      });
      assert.equal(response.status, 200);
      const parsed = await response.json();
      assert.equal(parsed.data.handled, false);
    } finally {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("ignores events for a PR Avenor didn't open", async () => {
    const res = await postWebhook({ action: "closed", pull_request: { number: 999999, merged: true }, repository: { full_name: "acme/unrelated" } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.handled, false);
  });

  describe("recognized pull_request events resolve the right incident", () => {
    let user, project, workspace, incident;

    before(async () => {
      const suffix = randomUUID().slice(0, 8);
      user = await prisma.user.create({ data: { name: "Webhook Owner", email: `webhook-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
      project = await prisma.project.create({ data: { name: `Webhook Proj ${suffix}`, slug: `webhook-proj-${suffix}`, ownerId: user.id } });
      workspace = await prisma.workspace.create({ data: { name: `Webhook WS ${suffix}`, slug: `webhook-ws-${suffix}`, ownerId: user.id } });
      incident = await prisma.dataIncident.create({
        data: {
          projectId: project.id,
          workspaceId: workspace.id,
          title: "Webhook test incident",
          fixApprovalStatus: "PR_CREATED",
          githubPr: { branch: "avenor/incident-abc", prNumber: 4242, prUrl: "https://github.com/acme/repo/pull/4242", fullName: "acme/repo" },
        },
      });
    });

    after(async () => {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    });

    it("a merged PR marks the incident RESOLVED and logs the timeline events", async () => {
      const res = await postWebhook({ action: "closed", pull_request: { number: 4242, merged: true, merged_by: { login: "octocat" } }, repository: { full_name: "acme/repo" } });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.handled, true);
      assert.equal(res.body.data.event, "merged");

      const updated = await prisma.dataIncident.findUnique({ where: { id: incident.id } });
      assert.equal(updated.fixApprovalStatus, "RESOLVED");
      assert.equal(updated.status, "RESOLVED");

      const events = await listEvents(incident.id);
      assert.ok(events.some((e) => e.type === "GITHUB_PR_MERGED"));
      assert.ok(events.some((e) => e.type === "INCIDENT_RESOLVED"));
    });

    it("a PR number match in a different repository is not treated as the same incident", async () => {
      const res = await postWebhook({ action: "closed", pull_request: { number: 4242, merged: true }, repository: { full_name: "someone-else/other-repo" } });
      assert.equal(res.body.data.handled, false);
    });
  });

  describe("a closed-without-merge event", () => {
    let user, project, workspace, incident;

    before(async () => {
      const suffix = randomUUID().slice(0, 8);
      user = await prisma.user.create({ data: { name: "Webhook Owner 2", email: `webhook2-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
      project = await prisma.project.create({ data: { name: `Webhook Proj 2 ${suffix}`, slug: `webhook-proj2-${suffix}`, ownerId: user.id } });
      workspace = await prisma.workspace.create({ data: { name: `Webhook WS 2 ${suffix}`, slug: `webhook-ws2-${suffix}`, ownerId: user.id } });
      incident = await prisma.dataIncident.create({
        data: { projectId: project.id, workspaceId: workspace.id, title: "Closed without merge", fixApprovalStatus: "PR_CREATED", githubPr: { branch: "avenor/incident-def", prNumber: 7, prUrl: "https://github.com/acme/repo2/pull/7", fullName: "acme/repo2" } },
      });
    });

    after(async () => {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    });

    it("logs GITHUB_PR_CLOSED but does NOT mark the incident resolved", async () => {
      const res = await postWebhook({ action: "closed", pull_request: { number: 7, merged: false }, repository: { full_name: "acme/repo2" } });
      assert.equal(res.body.data.event, "closed");

      const updated = await prisma.dataIncident.findUnique({ where: { id: incident.id } });
      assert.equal(updated.fixApprovalStatus, "PR_CREATED");
      assert.notEqual(updated.status, "RESOLVED");

      const events = await listEvents(incident.id);
      assert.ok(events.some((e) => e.type === "GITHUB_PR_CLOSED"));
      assert.ok(!events.some((e) => e.type === "GITHUB_PR_MERGED"));
    });
  });
});
