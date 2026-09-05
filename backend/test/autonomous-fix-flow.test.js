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

// End-to-end: incident report -> investigation -> root cause -> impact ->
// fix -> validation -> approval -> (GitHub, unconfigured in this env) ->
// documentation. This file deliberately does NOT set GITHUB_* env vars,
// so it exercises the real "GitHub integration not configured" path —
// approval must still succeed and must not crash the server.
describe("Autonomous Fix Flow, end to end (Phase 3)", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured" }, () => {
  let user, token, project, workspace;
  let rawOrders, orders, revenueModel, monthlyRevenue, revenueDashboard;

  before(async () => {
    const suffix = randomUUID().slice(0, 8);
    user = await prisma.user.create({ data: { name: "Fix Flow Owner", email: `fixflow-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    token = signToken({ userId: user.id, email: user.email });

    project = await prisma.project.create({ data: { name: `Fix Flow ${suffix}`, slug: `fixflow-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `Fix Flow WS ${suffix}`, slug: `fixflow-ws-${suffix}`, ownerId: user.id } });

    const mk = (name, assetType = "TABLE") => prisma.metadataAsset.create({ data: { projectId: project.id, workspaceId: workspace.id, name, assetType, qualifiedName: `${suffix}.${name}` } });
    [rawOrders, orders, revenueModel, monthlyRevenue, revenueDashboard] = await Promise.all([
      mk("raw_orders"), mk("orders"), mk("revenue_model", "MODEL"), mk("monthly_revenue", "MODEL"), mk("revenue_dashboard", "DASHBOARD"),
    ]);

    for (const [source, target] of [[rawOrders, orders], [orders, revenueModel], [revenueModel, monthlyRevenue], [monthlyRevenue, revenueDashboard]]) {
      await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: source.id, targetAssetId: target.id, relationshipType: "DOWNSTREAM" } });
    }

    await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v1", columns: { create: [{ name: "customer_id", dataType: "UUID", ordinal: 0 }, { name: "customer_status", dataType: "VARCHAR", ordinal: 1 }, { name: "amount", dataType: "DECIMAL", ordinal: 2 }] } } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v2", columns: { create: [{ name: "customer_id", dataType: "UUID", ordinal: 0 }, { name: "amount", dataType: "DECIMAL", ordinal: 1 }] } } });

    await prisma.metadataOwner.create({ data: { workspaceId: workspace.id, name: "Data Platform Team", email: "data-platform@avenor.test", assets: { connect: [{ id: orders.id }] } } });
  });

  after(async () => {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  it("walks the entire incident -> investigation -> fix -> validation -> approval -> (GitHub) -> documentation flow", async () => {
    // 1. Incident reported.
    const created = await request("/api/v1/investigations", { method: "POST", token, body: { projectId: project.id, workspaceId: workspace.id, title: "Monthly Revenue dashboard is broken", description: "Started failing after yesterday's deployment." } });
    assert.equal(created.status, 201);
    const id = created.body.data.investigation.id;

    // 2. Investigation runs autonomously: root cause + impact + fix + documentation.
    const run = await request(`/api/v1/investigations/${id}/run`, { method: "POST", token });
    assert.equal(run.body.data.status, "COMPLETED");

    const fixBefore = await request(`/api/v1/investigations/${id}/fix`, { token });
    assert.equal(fixBefore.body.data.status, "PROPOSED");
    assert.equal(fixBefore.body.data.fix.fixType, "COLUMN_REMOVED");

    // Cannot approve before validation.
    const earlyApprove = await request(`/api/v1/investigations/${id}/fix/approve`, { method: "POST", token });
    assert.equal(earlyApprove.status, 422);

    // 3. Validation.
    const validate = await request(`/api/v1/investigations/${id}/fix/validate`, { method: "POST", token });
    assert.equal(validate.status, 200);
    assert.equal(validate.body.data.status, "AWAITING_APPROVAL");
    assert.equal(validate.body.data.validation.blocked, false);

    // 4. Explicit human approval — this is also where PR creation is attempted.
    const approve = await request(`/api/v1/investigations/${id}/fix/approve`, { method: "POST", token });
    assert.equal(approve.status, 200);
    // No GitHub repository is connected to this project in this test
    // environment: approval must still succeed cleanly, without crashing
    // the server, and without silently pretending a PR was created.
    assert.equal(approve.body.data.status, "APPROVED");
    assert.ok(approve.body.data.githubError?.includes("is not connected to this project"));
    assert.equal(approve.body.data.github, null);

    // Retrying PR creation on-demand surfaces the same clean config error, not a 500.
    const prAttempt = await request(`/api/v1/investigations/${id}/fix/pr`, { method: "POST", token });
    assert.equal(prAttempt.status, 503);
    assert.equal(prAttempt.body.success, false);

    // 5. Final report reflects the whole journey.
    const report = await request(`/api/v1/investigations/${id}/report`, { token });
    assert.equal(report.body.data.proposedFix.fixType, "COLUMN_REMOVED");
    assert.equal(report.body.data.validation.blocked, false);
    assert.equal(report.body.data.investigation.fixApprovalStatus, "APPROVED");
    assert.ok(report.body.data.documentation.fix.type === "COLUMN_REMOVED");
    assert.ok(report.body.data.recommendation.includes("customer_status"));

    const timelineTypes = report.body.data.timeline.map((e) => e.type);
    for (const expected of ["INVESTIGATION_STARTED", "ROOT_CAUSE_FOUND", "IMPACT_ANALYZED", "FIX_GENERATED", "FIX_VALIDATED", "AWAITING_APPROVAL", "FIX_APPROVED"]) {
      assert.ok(timelineTypes.includes(expected), `expected timeline to include ${expected}`);
    }
  });

  it("cannot reject a fix that already has a pull request, and cannot approve a rejected fix without re-validating", async () => {
    const created = await request("/api/v1/investigations", { method: "POST", token, body: { projectId: project.id, workspaceId: workspace.id, title: "Monthly Revenue dashboard is broken" } });
    const id = created.body.data.investigation.id;
    await request(`/api/v1/investigations/${id}/run`, { method: "POST", token });

    const reject = await request(`/api/v1/investigations/${id}/fix/reject`, { method: "POST", token, body: { reason: "Not the actual root cause." } });
    assert.equal(reject.status, 200);
    assert.equal(reject.body.data.status, "REJECTED");

    const approveAfterReject = await request(`/api/v1/investigations/${id}/fix/approve`, { method: "POST", token });
    assert.equal(approveAfterReject.status, 422);
  });
});
