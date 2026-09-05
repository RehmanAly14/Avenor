import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { describe, it, before, after } from "node:test";
import bcrypt from "bcryptjs";

import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { signToken } from "../src/utils/jwt.js";
import * as planner from "../src/ai/agents/planner/index.js";
import * as investigator from "../src/ai/agents/investigator/index.js";
import * as impactAgent from "../src/ai/agents/impact/index.js";
import * as fixer from "../src/ai/agents/fixer/index.js";
import * as documentation from "../src/ai/agents/documentation/index.js";
import * as orchestrator from "../src/ai/orchestrator/index.js";

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

// Realistic lineage graph, matching the Phase 1 demo scenario:
//   raw_orders -> orders -> revenue_model -> monthly_revenue -> revenue_dashboard
// "orders" schema loses customer_status between v1 and v2 — the root cause
// the pipeline is expected to trace back to from a report about the dashboard.
describe("Avenor Autonomous Investigation Pipeline (Phase 2)", { skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured" }, () => {
  let user, token, project, workspace;
  let rawOrders, orders, revenueModel, monthlyRevenue, revenueDashboard;
  let ordersV1, ordersV2;

  before(async () => {
    const suffix = randomUUID().slice(0, 8);
    user = await prisma.user.create({ data: { name: "Pipeline Owner", email: `pipeline-${suffix}@avenor.test`, password: await bcrypt.hash("Password1!", 4) } });
    token = signToken({ userId: user.id, email: user.email });

    project = await prisma.project.create({ data: { name: `Pipeline Test ${suffix}`, slug: `pipeline-test-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `Pipeline WS ${suffix}`, slug: `pipeline-ws-${suffix}`, ownerId: user.id } });

    const mkAsset = (name, assetType = "TABLE") =>
      prisma.metadataAsset.create({ data: { projectId: project.id, workspaceId: workspace.id, name, assetType, qualifiedName: `${suffix}.${name}` } });

    [rawOrders, orders, revenueModel, monthlyRevenue, revenueDashboard] = await Promise.all([
      mkAsset("raw_orders"),
      mkAsset("orders"),
      mkAsset("revenue_model", "MODEL"),
      mkAsset("monthly_revenue", "MODEL"),
      mkAsset("revenue_dashboard", "DASHBOARD"),
    ]);

    const edges = [[rawOrders, orders], [orders, revenueModel], [revenueModel, monthlyRevenue], [monthlyRevenue, revenueDashboard]];
    for (const [source, target] of edges) {
      await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: source.id, targetAssetId: target.id, relationshipType: "DOWNSTREAM" } });
    }

    // customer_status removed between orders_v1 and orders_v2 (updatedAt strictly increasing).
    ordersV1 = await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v1", columns: { create: [{ name: "customer_id", dataType: "UUID", isNullable: false, ordinal: 0 }, { name: "customer_status", dataType: "VARCHAR", isNullable: true, ordinal: 1 }, { name: "amount", dataType: "DECIMAL", isNullable: false, ordinal: 2 }] } } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    ordersV2 = await prisma.metadataSchema.create({ data: { assetId: orders.id, name: "orders_v2", columns: { create: [{ name: "customer_id", dataType: "UUID", isNullable: false, ordinal: 0 }, { name: "amount", dataType: "DECIMAL", isNullable: false, ordinal: 1 }] } } });

    await prisma.metadataOwner.create({ data: { workspaceId: workspace.id, name: "Data Platform Team", email: "data-platform@avenor.test", assets: { connect: [{ id: orders.id }] } } });
  });

  after(async () => {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  describe("Planner agent", () => {
    it("resolves the reported asset and produces a structured plan", async () => {
      const plan = await planner.run({ userId: user.id, workspaceId: workspace.id, projectId: project.id, incidentDescription: "Monthly Revenue dashboard is broken" });
      assert.ok(plan.assetId, "expected the planner to resolve an asset");
      assert.ok(["monthly_revenue", "revenue_dashboard"].includes(plan.assetName));
      assert.ok(Array.isArray(plan.tasks) && plan.tasks.length >= 5);
      assert.ok(plan.tasks.every((t) => t.id && t.description && t.priority));
      assert.equal(plan.tasks[0].status, "resolved");
    });

    it("does not invent an asset for a vague, unmatched description", async () => {
      const plan = await planner.run({ userId: user.id, workspaceId: workspace.id, projectId: project.id, incidentDescription: "Something seems broken somewhere" });
      assert.equal(plan.assetId, null);
      assert.equal(plan.tasks[0].status, "unresolved");
    });
  });

  describe("Investigator agent", () => {
    let investigationId;
    before(async () => {
      const created = await prisma.dataIncident.create({ data: { projectId: project.id, workspaceId: workspace.id, title: "Dashboard broken" } });
      investigationId = created.id;
    });

    it("traces a multi-hop root cause upstream when the reported asset has no direct schema change", async () => {
      const result = await investigator.run({ userId: user.id, investigationId, assetId: revenueDashboard.id, problem: "Monthly Revenue dashboard is broken" });
      assert.equal(result.rootCause.type, "COLUMN_REMOVED");
      assert.equal(result.rootCause.column, "customer_status");
      assert.ok(result.rootCause.confidence >= 0.8);
      assert.equal(result.raw.rootAsset.name, "orders");
      // Every evidence entry must reference a real asset name from the graph — never invented.
      const knownNames = new Set(["orders", "raw_orders", "revenue_model", "monthly_revenue", "revenue_dashboard"]);
      assert.ok(result.evidence.every((e) => knownNames.has(e.asset)));
      assert.ok(result.evidence.some((e) => e.finding.includes("customer_status")));
    });
  });

  describe("Impact agent", () => {
    it("categorizes downstream impact and computes a risk level", async () => {
      const result = await impactAgent.run({ userId: user.id, assetId: orders.id });
      assert.equal(result.summary.totalAffected, 3);
      assert.equal(result.categories.dashboards, 1);
      assert.equal(result.categories.mlModels, 2);
      assert.equal(result.risk, "HIGH");
    });

    it("handles a cyclic lineage graph without hanging", async () => {
      const cycle = await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: revenueDashboard.id, targetAssetId: rawOrders.id, relationshipType: "DERIVED_FROM" } });
      try {
        const result = await impactAgent.run({ userId: user.id, assetId: rawOrders.id });
        assert.ok(result.summary.totalAffected >= 4);
        assert.equal(result.summary.totalAffected, new Set(result.assets.map((a) => a.id)).size);
      } finally {
        await prisma.metadataLineage.delete({ where: { id: cycle.id } });
      }
    });
  });

  describe("Fixer agent", () => {
    it("generates a structured, deterministic fix with tests and a proposal-only status", async () => {
      const result = await fixer.run({
        rootCause: { type: "COLUMN_REMOVED", column: "customer_status", confidence: 0.85, description: "customer_status was removed" },
        schemaChanges: [{ type: "COLUMN_REMOVED", column: "customer_status", severity: "HIGH" }],
        rootAsset: { name: "orders", qualifiedName: "test.orders" },
        downstreamAssets: [{ name: "revenue_model" }, { name: "monthly_revenue" }],
        impact: { summary: { totalAffected: 2 } },
      });
      assert.equal(result.fixType, "COLUMN_REMOVED");
      assert.equal(result.status, "PROPOSED");
      assert.ok(result.sql.includes("customer_status"));
      assert.ok(result.tests.length > 0);
      assert.ok(result.files.length > 0);
      assert.equal(result.risk, "HIGH");
      assert.ok(result.explanation.includes("has not been executed"));
    });

    it("falls back to a manual-review proposal when no schema change is available", async () => {
      const result = await fixer.run({ rootCause: { type: "NO_UPSTREAM", confidence: 0.4, description: "no upstream" }, schemaChanges: [], rootAsset: { name: "raw_orders" } });
      assert.equal(result.fixType, "MANUAL_REVIEW");
      assert.equal(result.status, "PROPOSED");
    });
  });

  describe("Documentation agent", () => {
    it("assembles a structured incident knowledge record", async () => {
      const result = await documentation.run({
        incident: { title: "Dashboard broken", severity: "MEDIUM" },
        reportedAssetName: "revenue_dashboard",
        rootCauseAssetName: "orders",
        rootCause: { description: "customer_status was removed", confidence: 0.85 },
        impactAssets: [{ id: "1", name: "revenue_dashboard", assetType: "DASHBOARD", depth: 1 }],
        fix: { fixType: "COLUMN_REMOVED", summary: "fix it", sql: "SELECT 1;", tests: ["t1"] },
        owners: [{ name: "Data Platform Team" }],
      });
      assert.equal(result.incident, "Dashboard broken");
      assert.equal(result.reportedAsset, "revenue_dashboard");
      assert.equal(result.rootCauseAsset, "orders");
      assert.equal(result.impact.dashboards.length, 1);
      assert.equal(result.fix.type, "COLUMN_REMOVED");
      assert.equal(result.resolution.status, "PROPOSED");
      assert.ok(result.resolution.timestamp);
      assert.equal(result.owner, "Data Platform Team");
      assert.ok(result.recommendations.length > 0);
      assert.ok(result.summary.includes("customer_status"));
    });
  });

  describe("Orchestrator", () => {
    it("runs the complete pipeline end-to-end via the HTTP API and produces a final report", async () => {
      const created = await request("/api/v1/investigations", { method: "POST", token, body: { projectId: project.id, workspaceId: workspace.id, title: "Monthly Revenue dashboard is broken", description: "The dashboard started failing after yesterday's deployment." } });
      assert.equal(created.status, 201);
      const investigationId = created.body.data.investigation.id;

      const run = await request(`/api/v1/investigations/${investigationId}/run`, { method: "POST", token });
      assert.equal(run.status, 200);
      assert.equal(run.body.data.status, "COMPLETED");

      const status = await request(`/api/v1/investigations/${investigationId}/status`, { token });
      assert.equal(status.status, 200);
      assert.equal(status.body.data.stage, "COMPLETED");

      const report = await request(`/api/v1/investigations/${investigationId}/report`, { token });
      assert.equal(report.status, 200);
      const data = report.body.data;
      assert.equal(data.complete, true);
      assert.equal(data.rootCause.type, "COLUMN_REMOVED");
      assert.equal(data.rootCause.column, "customer_status");
      assert.deepEqual(data.lineage, ["raw_orders", "orders", "revenue_model", "monthly_revenue", "revenue_dashboard"]);
      assert.equal(data.impact.summary.totalAffected, 3);
      assert.equal(data.proposedFix.status, "PROPOSED");
      assert.equal(data.proposedFix.fixType, "COLUMN_REMOVED");
      assert.ok(Array.isArray(data.timeline) && data.timeline.length > 0);
      assert.ok(data.recommendation.includes("customer_status"));
      assert.ok(data.documentation.recommendations.length > 0);
    });

    it("marks the investigation FAILED with a clear error when a stage throws", async () => {
      const created = await prisma.dataIncident.create({ data: { projectId: project.id, workspaceId: workspace.id, title: "Monthly Revenue dashboard is broken" } });
      const result = await orchestrator.runPipeline({ investigationId: created.id, userId: user.id }, {
        impact: { run: async () => { throw new Error("Impact service unavailable"); } },
      });
      assert.equal(result.stage, "FAILED");
      assert.equal(result.error, "Impact service unavailable");
      // Earlier stages' output is still persisted for inspection.
      assert.ok(result.plan);
      assert.ok(result.evidence);
    });

    it("fails clearly (does not crash) when no asset can be resolved from the incident text", async () => {
      const created = await prisma.dataIncident.create({ data: { projectId: project.id, workspaceId: workspace.id, title: "Something seems broken somewhere" } });
      const result = await orchestrator.runPipeline({ investigationId: created.id, userId: user.id });
      assert.equal(result.stage, "FAILED");
      assert.ok(result.error.includes("Could not resolve an asset"));
    });
  });
});
