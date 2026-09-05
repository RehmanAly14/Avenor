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
      headers: {
        "content-type": "application/json",
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

// Realistic lineage graph:
//   raw_orders -> orders -> revenue_model -> monthly_revenue -> revenue_dashboard
describe("Avenor Metadata Intelligence Engine", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured" }, () => {
  let user, token, otherUser, otherToken, project, workspace;
  let rawOrders, orders, revenueModel, monthlyRevenue, revenueDashboard;

  before(async () => {
    const suffix = randomUUID().slice(0, 8);
    user = await prisma.user.create({ data: { name: "Test Owner", email: `owner-${suffix}@avenor.test`, password: await bcrypt.hash("Password1!", 4) } });
    otherUser = await prisma.user.create({ data: { name: "Other Owner", email: `other-${suffix}@avenor.test`, password: await bcrypt.hash("Password1!", 4) } });
    token = signToken({ userId: user.id, email: user.email });
    otherToken = signToken({ userId: otherUser.id, email: otherUser.email });

    project = await prisma.project.create({ data: { name: `Lineage Test ${suffix}`, slug: `lineage-test-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `Lineage WS ${suffix}`, slug: `lineage-ws-${suffix}`, ownerId: user.id } });

    const mkAsset = (name, assetType = "TABLE") =>
      prisma.metadataAsset.create({ data: { projectId: project.id, workspaceId: workspace.id, name, assetType, qualifiedName: `${suffix}.${name}` } });

    [rawOrders, orders, revenueModel, monthlyRevenue, revenueDashboard] = await Promise.all([
      mkAsset("raw_orders"),
      mkAsset("orders"),
      mkAsset("revenue_model", "MODEL"),
      mkAsset("monthly_revenue", "MODEL"),
      mkAsset("revenue_dashboard", "DASHBOARD"),
    ]);

    const edges = [
      [rawOrders, orders],
      [orders, revenueModel],
      [revenueModel, monthlyRevenue],
      [monthlyRevenue, revenueDashboard],
    ];
    for (const [source, target] of edges) {
      await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: source.id, targetAssetId: target.id, relationshipType: "DOWNSTREAM" } });
    }
  });

  after(async () => {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: otherUser.id } }).catch(() => {});
  });

  it("rejects self-lineage at the validation layer", async () => {
    const res = await request("/api/v1/metadata/lineage", { method: "POST", token, body: { sourceAssetId: orders.id, targetAssetId: orders.id, relationshipType: "DOWNSTREAM" } });
    assert.equal(res.status, 422);
  });

  it("creates a lineage relationship", async () => {
    const res = await request("/api/v1/metadata/lineage", { method: "POST", token, body: { sourceAssetId: revenueModel.id, targetAssetId: revenueDashboard.id, relationshipType: "DERIVED_FROM", confidence: 0.9 } });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.lineage.sourceAssetId, revenueModel.id);
    // Clean up the extra edge so later depth assertions stay predictable.
    await prisma.metadataLineage.delete({ where: { id: res.body.data.lineage.id } });
  });

  it("prevents duplicate lineage relationships", async () => {
    const first = await request("/api/v1/metadata/lineage", { method: "POST", token, body: { sourceAssetId: orders.id, targetAssetId: revenueModel.id, relationshipType: "READS_FROM" } });
    assert.equal(first.status, 201);
    const dup = await request("/api/v1/metadata/lineage", { method: "POST", token, body: { sourceAssetId: orders.id, targetAssetId: revenueModel.id, relationshipType: "READS_FROM" } });
    assert.equal(dup.status, 409);
    await prisma.metadataLineage.delete({ where: { id: first.body.data.lineage.id } });
  });

  it("traverses upstream dependencies recursively", async () => {
    const res = await request(`/api/v1/metadata/lineage/${revenueDashboard.id}/upstream`, { token });
    assert.equal(res.status, 200);
    const names = res.body.data.upstream.map((a) => a.name).sort();
    assert.deepEqual(names, ["monthly_revenue", "orders", "raw_orders", "revenue_model"]);
    const orderRow = res.body.data.upstream.find((a) => a.name === "orders");
    assert.equal(orderRow.depth, 3);
  });

  it("traverses downstream dependents recursively", async () => {
    const res = await request(`/api/v1/metadata/lineage/${orders.id}/downstream`, { token });
    assert.equal(res.status, 200);
    const names = res.body.data.downstream.map((a) => a.name).sort();
    assert.deepEqual(names, ["monthly_revenue", "revenue_dashboard", "revenue_model"]);
  });

  it("returns a React-Flow-ready graph with nodes and edges", async () => {
    const res = await request(`/api/v1/metadata/lineage/${orders.id}/graph`, { token });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.nodes));
    assert.ok(Array.isArray(res.body.data.edges));
    assert.ok(res.body.data.nodes.every((n) => n.position && typeof n.position.x === "number"));
    assert.ok(res.body.data.nodes.some((n) => n.data.label === "revenue_dashboard"));
  });

  it("runs recursive impact analysis and categorizes affected dashboards/models", async () => {
    const res = await request(`/api/v1/metadata/impact/${orders.id}`, { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.totalImpact, 3);
    assert.equal(res.body.data.affectedDashboards.length, 1);
    assert.equal(res.body.data.affectedDashboards[0].name, "revenue_dashboard");
    assert.equal(res.body.data.affectedModels.length, 2);
    const dashboardImpact = res.body.data.affectedAssets.find((a) => a.name === "revenue_dashboard");
    assert.equal(dashboardImpact.depth, 3);
  });

  it("does not infinite-loop on a cyclic lineage graph", async () => {
    const cycleEdge = await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: revenueDashboard.id, targetAssetId: rawOrders.id, relationshipType: "DERIVED_FROM" } });
    try {
      const res = await request(`/api/v1/metadata/lineage/${rawOrders.id}/downstream`, { token });
      assert.equal(res.status, 200);
      const names = res.body.data.downstream.map((a) => a.name);
      // Every asset in the cycle appears exactly once, despite the loop back to raw_orders.
      assert.equal(names.length, new Set(names).size);
      assert.ok(names.includes("revenue_dashboard"));
    } finally {
      await prisma.metadataLineage.delete({ where: { id: cycleEdge.id } });
    }
  });

  it("ranks metadata search results across name, tags, and columns", async () => {
    const res = await request(`/api/v1/metadata/intelligence/search?q=revenue&workspaceId=${workspace.id}&projectId=${project.id}`, { token });
    assert.equal(res.status, 200);
    const names = res.body.data.results.map((a) => a.name);
    assert.ok(names.includes("revenue_model"));
    assert.ok(names.includes("revenue_dashboard"));
    assert.ok(names.includes("monthly_revenue"));
  });

  it("compares two raw schema snapshots and flags a removed column as HIGH severity", async () => {
    const res = await request("/api/v1/metadata/schema/compare", {
      method: "POST",
      token,
      body: {
        oldColumns: [
          { name: "customer_id", dataType: "UUID", isNullable: false },
          { name: "customer_status", dataType: "VARCHAR", isNullable: true },
          { name: "amount", dataType: "DECIMAL", isNullable: false },
        ],
        newColumns: [
          { name: "customer_id", dataType: "UUID", isNullable: false },
          { name: "amount", dataType: "DECIMAL", isNullable: false },
        ],
      },
    });
    assert.equal(res.status, 200);
    const removed = res.body.data.changes.find((c) => c.type === "COLUMN_REMOVED");
    assert.equal(removed.column, "customer_status");
    assert.equal(removed.severity, "HIGH");
  });

  it("blocks a user from reading lineage that belongs to another user's workspace", async () => {
    const res = await request(`/api/v1/metadata/lineage/${orders.id}`, { token: otherToken });
    assert.equal(res.status, 403);
  });

  describe("Investigation Engine", () => {
    let ordersV1, ordersV2, investigationId;

    before(async () => {
      ordersV1 = await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v1", columns: { create: [{ name: "customer_id", dataType: "UUID", isNullable: false, ordinal: 0 }, { name: "customer_status", dataType: "VARCHAR", isNullable: true, ordinal: 1 }, { name: "amount", dataType: "DECIMAL", isNullable: false, ordinal: 2 }] } } });
      // updatedAt must be strictly after ordersV1's for detectSchemaChanges to treat this as "latest".
      await new Promise((resolve) => setTimeout(resolve, 20));
      ordersV2 = await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v2", columns: { create: [{ name: "customer_id", dataType: "UUID", isNullable: false, ordinal: 0 }, { name: "amount", dataType: "DECIMAL", isNullable: false, ordinal: 1 }] } } });
    });

    after(async () => {
      await prisma.metadataSchema.deleteMany({ where: { id: { in: [ordersV1.id, ordersV2.id] } } });
    });

    it("creates an investigation as an OPEN incident", async () => {
      const res = await request("/api/v1/investigations", { method: "POST", token, body: { projectId: project.id, workspaceId: workspace.id, title: "Dashboard showing errors" } });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.investigation.status, "OPEN");
      investigationId = res.body.data.investigation.id;
    });

    it("runs a deterministic analysis and surfaces the schema-change root cause plus downstream impact", async () => {
      const res = await request(`/api/v1/investigations/${investigationId}/analyze`, { method: "POST", token, body: { assetId: orders.id, problem: "Dashboard is showing errors" } });
      assert.equal(res.status, 200);
      const result = res.body.data;
      assert.equal(result.incident.status, "INVESTIGATING");
      assert.equal(result.rootAsset.id, orders.id);

      const removedChange = result.schemaChanges.find((c) => c.type === "COLUMN_REMOVED");
      assert.equal(removedChange.column, "customer_status");

      const rootCauseHitsSchema = result.rootCauseCandidates.some((c) => c.column === "customer_status");
      assert.ok(rootCauseHitsSchema);

      const downstreamNames = result.downstreamAssets.map((a) => a.name).sort();
      assert.deepEqual(downstreamNames, ["monthly_revenue", "revenue_dashboard", "revenue_model"]);

      assert.equal(result.affectedAssets.length, 3);
      assert.ok(result.recommendations.length > 0);
    });
  });
});
