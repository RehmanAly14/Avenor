import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { describe, it, before, after } from "node:test";
import bcrypt from "bcryptjs";

import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { signToken } from "../src/utils/jwt.js";

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

describe("Incident Timeline (Phase 3)", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured" }, () => {
  let user, otherUser, token, otherToken, project, workspace;
  let orders, revenueDashboard;

  before(async () => {
    const suffix = randomUUID().slice(0, 8);
    user = await prisma.user.create({ data: { name: "Timeline Owner", email: `timeline-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    otherUser = await prisma.user.create({ data: { name: "Other Owner", email: `timeline-other-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    token = signToken({ userId: user.id, email: user.email });
    otherToken = signToken({ userId: otherUser.id, email: otherUser.email });

    project = await prisma.project.create({ data: { name: `Timeline Proj ${suffix}`, slug: `timeline-proj-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `Timeline WS ${suffix}`, slug: `timeline-ws-${suffix}`, ownerId: user.id } });

    const mk = (name, assetType = "TABLE") => prisma.metadataAsset.create({ data: { projectId: project.id, workspaceId: workspace.id, name, assetType, qualifiedName: `${suffix}.${name}` } });
    orders = await mk("orders");
    revenueDashboard = await mk("revenue_dashboard", "DASHBOARD");
    await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: orders.id, targetAssetId: revenueDashboard.id, relationshipType: "DOWNSTREAM" } });

    await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v1", columns: { create: [{ name: "customer_id", dataType: "UUID", ordinal: 0 }, { name: "customer_status", dataType: "VARCHAR", ordinal: 1 }] } } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v2", columns: { create: [{ name: "customer_id", dataType: "UUID", ordinal: 0 }] } } });
  });

  after(async () => {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: otherUser.id } }).catch(() => {});
  });

  it("records an ordered timeline of pipeline events as the investigation runs", async () => {
    const created = await request("/api/v1/investigations", { method: "POST", token, body: { projectId: project.id, workspaceId: workspace.id, title: "Revenue dashboard is broken" } });
    const investigationId = created.body.data.investigation.id;

    const run = await request(`/api/v1/investigations/${investigationId}/run`, { method: "POST", token });
    assert.equal(run.body.data.status, "COMPLETED");

    const timeline = await request(`/api/v1/investigations/${investigationId}/timeline`, { token });
    assert.equal(timeline.status, 200);
    const types = timeline.body.data.timeline.map((e) => e.type);

    assert.deepEqual(types, [
      "INVESTIGATION_STARTED",
      "ASSET_RESOLVED",
      "ROOT_CAUSE_FOUND",
      "IMPACT_ANALYZED",
      "FIX_GENERATED",
      "DOCUMENTATION_GENERATED",
    ]);

    // Timeline is chronologically ordered.
    const timestamps = timeline.body.data.timeline.map((e) => new Date(e.createdAt).getTime());
    assert.deepEqual(timestamps, [...timestamps].sort((a, b) => a - b));

    // Continuing through validate/approve appends further events, doesn't replace the history.
    await request(`/api/v1/investigations/${investigationId}/fix/validate`, { method: "POST", token });
    const afterValidate = await request(`/api/v1/investigations/${investigationId}/timeline`, { token });
    const validateTypes = afterValidate.body.data.timeline.map((e) => e.type);
    assert.ok(validateTypes.includes("FIX_VALIDATED"));
    assert.ok(validateTypes.includes("AWAITING_APPROVAL"));
    assert.ok(validateTypes.length > types.length);
  });

  it("blocks a user from reading another user's incident timeline", async () => {
    const created = await request("/api/v1/investigations", { method: "POST", token, body: { projectId: project.id, workspaceId: workspace.id, title: "Private incident" } });
    const investigationId = created.body.data.investigation.id;
    const res = await request(`/api/v1/investigations/${investigationId}/timeline`, { token: otherToken });
    assert.equal(res.status, 403);
  });
});
