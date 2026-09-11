import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { describe, it, before, after } from "node:test";
import bcrypt from "bcryptjs";
import pg from "pg";

import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { signToken } from "../src/utils/jwt.js";
import { createDataSource, syncDataSource } from "../src/modules/datasources/datasource.service.js";

const { Client } = pg;
const hasDb = Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL);

function rawConfig() {
  const url = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
  return { host: url.hostname, port: Number(url.port), database: url.pathname.slice(1), username: url.username, password: decodeURIComponent(url.password) };
}

async function raw(sql) {
  const c = rawConfig();
  const client = new Client({ host: c.host, port: c.port, database: c.database, user: c.username, password: c.password });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
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

// The point of this file: everything upstream of "the investigation ran
// successfully" is built from REAL PostgreSQL objects and a REAL sync —
// not hand-seeded MetadataLineage rows. raw_orders -> orders is a real
// foreign key; orders -> revenue_model -> monthly_revenue are a real view
// and a real materialized view, both auto-discovered. The one edge that
// is NOT a Postgres object — monthly_revenue -> revenue_dashboard, since
// a BI dashboard isn't a database relation — is added manually, exactly
// as a future BI/dbt lineage provider would, and deliberately left
// untagged so PostgreSQL sync never mistakes it for its own output.
//
// No production code anywhere references "orders", "revenue_dashboard",
// or "customer_status" by name — the pipeline resolves and traces all of
// it generically from whatever the database and the metadata graph
// actually contain.
describe("PostgreSQL-discovered lineage powers the investigation pipeline end-to-end", { skip: !hasDb && "DATABASE_URL is not configured" }, () => {
  const suffix = randomUUID().slice(0, 8).replace(/-/g, "");
  const schemaName = `investigation_demo_${suffix}`;
  let user, token, project, workspace, dataSource;
  let revenueDashboard;

  before(async () => {
    await raw(`CREATE SCHEMA ${schemaName}`);
    await raw(`CREATE TABLE ${schemaName}.raw_orders (id uuid PRIMARY KEY, customer_id uuid, amount numeric)`);
    await raw(`
      CREATE TABLE ${schemaName}.orders (
        id uuid PRIMARY KEY,
        raw_order_id uuid REFERENCES ${schemaName}.raw_orders(id),
        customer_id uuid,
        customer_status varchar,
        amount numeric
      )
    `);
    await raw(`CREATE VIEW ${schemaName}.revenue_model AS SELECT customer_id, sum(amount) AS total FROM ${schemaName}.orders GROUP BY customer_id`);
    await raw(`CREATE MATERIALIZED VIEW ${schemaName}.monthly_revenue AS SELECT * FROM ${schemaName}.revenue_model`);

    user = await prisma.user.create({ data: { name: "Investigation Demo Owner", email: `pg-investigation-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    token = signToken({ userId: user.id, email: user.email });
    project = await prisma.project.create({ data: { name: `PG Investigation ${suffix}`, slug: `pg-investigation-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `PG Investigation WS ${suffix}`, slug: `pg-investigation-ws-${suffix}`, ownerId: user.id } });

    const c = rawConfig();
    dataSource = await createDataSource(user.id, { projectId: project.id, workspaceId: workspace.id, name: `PG Investigation DS ${suffix}`, provider: "POSTGRESQL", host: c.host, port: c.port, database: c.database, username: c.username, password: c.password });
  });

  after(async () => {
    await raw(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  it("step 1-4: connecting and syncing a real database discovers real assets and real lineage", async () => {
    const summary = await syncDataSource(dataSource.id, user.id, { schemas: [schemaName] });
    assert.equal(summary.assetsCreated, 4);
    assert.equal(summary.lineageCreated, 3);

    // displayName() only leaves "public"-schema names bare — this test uses
    // a dedicated non-public schema (so it doesn't also catalog Avenor's own
    // application tables), so every real-table name below is schema-prefixed.
    const dn = (table) => `${schemaName}.${table}`;
    const assets = await prisma.metadataAsset.findMany({ where: { dataSourceId: dataSource.id } });
    const byName = Object.fromEntries(assets.map((a) => [a.name, a]));
    assert.equal(byName[dn("raw_orders")].assetType, "TABLE");
    assert.equal(byName[dn("orders")].assetType, "TABLE");
    assert.equal(byName[dn("revenue_model")].assetType, "VIEW");
    assert.equal(byName[dn("monthly_revenue")].assetType, "MATERIALIZED_VIEW");

    const lineage = await prisma.metadataLineage.findMany({ where: { sourceAsset: { dataSourceId: dataSource.id } }, include: { sourceAsset: true, targetAsset: true } });
    const pairs = lineage.map((l) => `${l.sourceAsset.name}->${l.targetAsset.name}`).sort();
    assert.deepEqual(pairs, [`${dn("orders")}->${dn("revenue_model")}`, `${dn("raw_orders")}->${dn("orders")}`, `${dn("revenue_model")}->${dn("monthly_revenue")}`]);

    // The one edge PostgreSQL cannot know about — added manually, exactly as a future BI-lineage provider eventually would. Not sync-tagged, so it's immune to PostgreSQL sync's stale-lineage cleanup. Given a bare name (it's not a real database relation), so it reads naturally in the incident text below.
    revenueDashboard = await prisma.metadataAsset.create({ data: { projectId: project.id, workspaceId: workspace.id, name: "revenue_dashboard", qualifiedName: `${suffix}.revenue_dashboard`, assetType: "DASHBOARD" } });
    await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: byName[dn("monthly_revenue")].id, targetAssetId: revenueDashboard.id, relationshipType: "DOWNSTREAM" } });
  });

  it("step 5-7: a real schema change on the real table produces real, re-syncable history", async () => {
    await raw(`ALTER TABLE ${schemaName}.orders DROP COLUMN customer_status`);
    const summary = await syncDataSource(dataSource.id, user.id, { schemas: [schemaName] });
    assert.equal(summary.schemaChangesDetected, 1);

    const orders = await prisma.metadataAsset.findFirstOrThrow({ where: { dataSourceId: dataSource.id, name: `${schemaName}.orders` }, include: { schemas: { orderBy: { createdAt: "desc" }, include: { columns: true } } } });
    assert.equal(orders.schemas.length, 2);
    assert.ok(orders.schemas[1].columns.some((c) => c.name === "customer_status"), "the older snapshot must still show the column existed");
    assert.ok(!orders.schemas[0].columns.some((c) => c.name === "customer_status"), "the latest snapshot must reflect it being gone");
  });

  it("step 8-11: the autonomous investigation pipeline traces root cause, impact, and a fix through real synced lineage alone", async () => {
    const created = await request("/api/v1/investigations", {
      method: "POST",
      token,
      body: { projectId: project.id, workspaceId: workspace.id, title: "revenue_dashboard is broken after a recent database schema change", description: "Numbers on revenue_dashboard look wrong since this morning." },
    });
    assert.equal(created.status, 201);
    const investigationId = created.body.data.investigation.id;

    const run = await request(`/api/v1/investigations/${investigationId}/run`, { method: "POST", token });
    assert.equal(run.status, 200);
    assert.equal(run.body.data.status, "COMPLETED");

    const report = await request(`/api/v1/investigations/${investigationId}/report`, { token });
    assert.equal(report.status, 200);
    const data = report.body.data;

    // Root cause: traced upstream, past the reported dashboard, past two real Postgres view layers, to the real table where a real column was really dropped.
    assert.equal(data.rootCause.type, "COLUMN_REMOVED");
    assert.equal(data.rootCause.column, "customer_status");

    // Lineage: every hop came from real Postgres objects except the manually-added dashboard edge — proving the chain isn't hand-seeded.
    const dn = (table) => `${schemaName}.${table}`;
    assert.deepEqual(data.lineage, [dn("raw_orders"), dn("orders"), dn("revenue_model"), dn("monthly_revenue"), "revenue_dashboard"]);

    // Impact: everything downstream of the real root cause.
    assert.ok(data.impact.summary.totalAffected >= 3);

    // Fix: a structured proposal, still requiring human approval.
    assert.equal(data.proposedFix.status, "PROPOSED");
    assert.equal(data.proposedFix.fixType, "COLUMN_REMOVED");
    assert.ok(data.recommendation.includes("customer_status"));
  });
});
