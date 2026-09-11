import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it, before, after } from "node:test";
import bcrypt from "bcryptjs";
import pg from "pg";

import prisma from "../src/config/prisma.js";
import { encrypt } from "../src/utils/encryption.js";
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

// End-to-end against a real, disposable PostgreSQL schema — proves sync
// reconciliation (create/update, idempotency, staleness removal, manual
// lineage preservation) against actual foreign keys and view dependencies,
// not fixtures. `schemas` scopes each sync to just its own test schema so
// this doesn't also catalog Avenor's own application database.
describe("PostgreSQL data source sync — lineage reconciliation", { skip: !hasDb && "DATABASE_URL is not configured" }, () => {
  const suffix = randomUUID().slice(0, 8).replace(/-/g, "");
  const schemaName = `sync_lineage_${suffix}`;
  let user, project, workspace, dataSource;

  before(async () => {
    await raw(`CREATE SCHEMA ${schemaName}`);
    await raw(`CREATE TABLE ${schemaName}.customers (id uuid PRIMARY KEY, name text)`);
    await raw(`CREATE TABLE ${schemaName}.products (id uuid PRIMARY KEY, sku text)`);
    await raw(`CREATE TABLE ${schemaName}.orders (id uuid PRIMARY KEY, customer_id uuid REFERENCES ${schemaName}.customers(id), product_id uuid REFERENCES ${schemaName}.products(id), amount numeric)`);
    await raw(`CREATE VIEW ${schemaName}.revenue_model AS SELECT customer_id, sum(amount) AS total FROM ${schemaName}.orders GROUP BY customer_id`);

    user = await prisma.user.create({ data: { name: "Sync Lineage Owner", email: `sync-lineage-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    project = await prisma.project.create({ data: { name: `Sync Lineage ${suffix}`, slug: `sync-lineage-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `Sync Lineage WS ${suffix}`, slug: `sync-lineage-ws-${suffix}`, ownerId: user.id } });

    const c = rawConfig();
    dataSource = await createDataSource(user.id, { projectId: project.id, workspaceId: workspace.id, name: `Sync Lineage DS ${suffix}`, provider: "POSTGRESQL", host: c.host, port: c.port, database: c.database, username: c.username, password: c.password });
  });

  after(async () => {
    await raw(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  const opts = { schemas: [schemaName] };

  it("first sync creates assets and lineage from real foreign keys and a real view dependency", async () => {
    const summary = await syncDataSource(dataSource.id, user.id, opts);
    assert.equal(summary.tablesScanned, 4);
    assert.equal(summary.assetsCreated, 4);
    assert.equal(summary.lineageDiscovered, 3);
    assert.equal(summary.lineageCreated, 3);
    assert.equal(summary.lineageRemoved, 0);
    assert.equal(summary.lineageError, null);

    const lineage = await prisma.metadataLineage.findMany({ where: { sourceAsset: { dataSourceId: dataSource.id } }, include: { sourceAsset: true, targetAsset: true } });
    assert.equal(lineage.length, 3);
    const pairs = lineage.map((l) => `${l.sourceAsset.name}->${l.targetAsset.name}:${l.relationshipType}`).sort();
    // displayName() only leaves "public"-schema names bare — a non-public
    // test schema (used here so this doesn't also catalog Avenor's own
    // application tables) is correctly prefixed, per Task 10.
    assert.deepEqual(pairs, [
      `${schemaName}.customers->${schemaName}.orders:READS_FROM`,
      `${schemaName}.orders->${schemaName}.revenue_model:DERIVED_FROM`,
      `${schemaName}.products->${schemaName}.orders:READS_FROM`,
    ]);
    for (const l of lineage) {
      assert.equal(l.metadata.provider, "POSTGRESQL");
      assert.ok(["FOREIGN_KEY", "VIEW_DEPENDENCY"].includes(l.metadata.discoveryMethod));
    }
  });

  it("re-syncing an unchanged database is idempotent — no duplicate lineage rows", async () => {
    const countBefore = await prisma.metadataLineage.count({ where: { sourceAsset: { dataSourceId: dataSource.id } } });
    const summary = await syncDataSource(dataSource.id, user.id, opts);
    assert.equal(summary.lineageCreated, 3);
    const countAfter = await prisma.metadataLineage.count({ where: { sourceAsset: { dataSourceId: dataSource.id } } });
    assert.equal(countAfter, countBefore);
  });

  it("a manually-created lineage edge between the same assets is never touched by sync", async () => {
    const orders = await prisma.metadataAsset.findFirstOrThrow({ where: { dataSourceId: dataSource.id, name: `${schemaName}.orders` } });
    const revenueModel = await prisma.metadataAsset.findFirstOrThrow({ where: { dataSourceId: dataSource.id, name: `${schemaName}.revenue_model` } });
    // A different relationshipType than the auto-discovered DERIVED_FROM edge, so this is a distinct row under the @@unique constraint, not an overwrite of it.
    const manual = await prisma.metadataLineage.create({ data: { projectId: project.id, workspaceId: workspace.id, sourceAssetId: orders.id, targetAssetId: revenueModel.id, relationshipType: "WRITES_TO" } });

    await syncDataSource(dataSource.id, user.id, opts);

    const stillThere = await prisma.metadataLineage.findUnique({ where: { id: manual.id } });
    assert.ok(stillThere, "manually created lineage must survive a sync");
    assert.equal(stillThere.metadata, null, "manual lineage was never tagged with a provider, so it must never look like a PostgreSQL-sync row");
  });

  it("dropping a foreign key removes only that stale PostgreSQL-generated edge on the next sync", async () => {
    await raw(`ALTER TABLE ${schemaName}.orders DROP CONSTRAINT orders_product_id_fkey`);
    const summary = await syncDataSource(dataSource.id, user.id, opts);
    assert.equal(summary.lineageRemoved, 1);
    assert.equal(summary.lineageCreated, 2);

    const postgresLineage = await prisma.metadataLineage.findMany({ where: { sourceAsset: { dataSourceId: dataSource.id } }, include: { sourceAsset: true, targetAsset: true } });
    const autoDiscovered = postgresLineage.filter((l) => l.metadata?.provider === "POSTGRESQL");
    assert.equal(autoDiscovered.length, 2);
    assert.ok(!autoDiscovered.some((l) => l.sourceAsset.name === `${schemaName}.products`), "products -> orders must be gone");
    assert.ok(autoDiscovered.some((l) => l.sourceAsset.name === `${schemaName}.customers` && l.targetAsset.name === `${schemaName}.orders`), "customers -> orders must remain");

    // The manually-created edge from the previous test (untagged, different relationshipType) must still be present.
    const manualStillThere = postgresLineage.find((l) => l.relationshipType === "WRITES_TO");
    assert.ok(manualStillThere);
  });

  it("dropping a real column and re-syncing produces a new schema snapshot with real change history", async () => {
    await raw(`ALTER TABLE ${schemaName}.customers ADD COLUMN temp_note text`);
    await syncDataSource(dataSource.id, user.id, opts);
    await raw(`ALTER TABLE ${schemaName}.customers DROP COLUMN temp_note`);
    const summary = await syncDataSource(dataSource.id, user.id, opts);
    assert.equal(summary.schemaChangesDetected, 1);

    const customers = await prisma.metadataAsset.findFirstOrThrow({ where: { dataSourceId: dataSource.id, name: `${schemaName}.customers` }, include: { schemas: { orderBy: { createdAt: "desc" }, include: { columns: true } } } });
    assert.ok(customers.schemas.length >= 3, "add + drop each produce their own snapshot");
    assert.deepEqual(customers.schemas[0].columns.map((c) => c.name).sort(), ["id", "name"]);
  });
});

// Two DataSource records pointed at two structurally-identical-but-separate
// schemas (same table/column names in both) on the same physical database.
// Every asset's qualifiedName is prefixed by its own DataSource's id, so
// even identical table names can never resolve to each other's assets —
// this proves that structurally, not just by coincidence of schema names.
describe("PostgreSQL data source sync — multiple data sources stay isolated", { skip: !hasDb && "DATABASE_URL is not configured" }, () => {
  const suffix = randomUUID().slice(0, 8).replace(/-/g, "");
  const schemaA = `sync_isolate_a_${suffix}`;
  const schemaB = `sync_isolate_b_${suffix}`;
  let user, project, workspace, dataSourceA, dataSourceB;

  before(async () => {
    for (const schema of [schemaA, schemaB]) {
      await raw(`CREATE SCHEMA ${schema}`);
      await raw(`CREATE TABLE ${schema}.customers (id uuid PRIMARY KEY, name text)`);
      await raw(`CREATE TABLE ${schema}.orders (id uuid PRIMARY KEY, customer_id uuid REFERENCES ${schema}.customers(id))`);
    }

    user = await prisma.user.create({ data: { name: "Isolation Owner", email: `sync-isolate-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    project = await prisma.project.create({ data: { name: `Isolation ${suffix}`, slug: `sync-isolate-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `Isolation WS ${suffix}`, slug: `sync-isolate-ws-${suffix}`, ownerId: user.id } });

    const c = rawConfig();
    const base = { projectId: project.id, workspaceId: workspace.id, provider: "POSTGRESQL", host: c.host, port: c.port, database: c.database, username: c.username, password: c.password };
    dataSourceA = await createDataSource(user.id, { ...base, name: `Isolation DS A ${suffix}` });
    dataSourceB = await createDataSource(user.id, { ...base, name: `Isolation DS B ${suffix}` });
  });

  after(async () => {
    await raw(`DROP SCHEMA IF EXISTS ${schemaA} CASCADE`);
    await raw(`DROP SCHEMA IF EXISTS ${schemaB} CASCADE`);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  it("each data source only ever creates and links its own assets, never the other's", async () => {
    await syncDataSource(dataSourceA.id, user.id, { schemas: [schemaA] });
    await syncDataSource(dataSourceB.id, user.id, { schemas: [schemaB] });

    const assetsA = await prisma.metadataAsset.findMany({ where: { dataSourceId: dataSourceA.id } });
    const assetsB = await prisma.metadataAsset.findMany({ where: { dataSourceId: dataSourceB.id } });
    assert.equal(assetsA.length, 2);
    assert.equal(assetsB.length, 2);
    assert.notEqual(assetsA.find((a) => a.name === `${schemaA}.orders`).id, assetsB.find((a) => a.name === `${schemaB}.orders`).id);

    const lineageA = await prisma.metadataLineage.findMany({ where: { sourceAsset: { dataSourceId: dataSourceA.id } } });
    const lineageB = await prisma.metadataLineage.findMany({ where: { sourceAsset: { dataSourceId: dataSourceB.id } } });
    assert.equal(lineageA.length, 1);
    assert.equal(lineageB.length, 1);
    assert.notEqual(lineageA[0].sourceAssetId, lineageB[0].sourceAssetId);
    assert.notEqual(lineageA[0].targetAssetId, lineageB[0].targetAssetId);

    // Re-syncing A alone must never touch B's rows.
    const removedFromB = await prisma.metadataLineage.count({ where: { sourceAsset: { dataSourceId: dataSourceB.id } } });
    await syncDataSource(dataSourceA.id, user.id, { schemas: [schemaA] });
    assert.equal(await prisma.metadataLineage.count({ where: { sourceAsset: { dataSourceId: dataSourceB.id } } }), removedFromB);
  });
});

// Deterministic tests for two defensive branches that are impractical to
// reliably reproduce with real Postgres permissions/extensions (a
// discovered relationship whose target isn't a synced asset; a database
// role that can read information_schema but not pg_catalog) — mocked at
// the postgres.introspect.js boundary instead, real Prisma underneath.
describe("PostgreSQL data source sync — reconciliation edge cases", { skip: !hasDb && "DATABASE_URL is not configured" }, () => {
  let user, project, workspace, dataSource;
  const suffix = randomUUID().slice(0, 8).replace(/-/g, "");

  before(async () => {
    user = await prisma.user.create({ data: { name: "Edge Case Owner", email: `sync-edge-${suffix}@avenor.test`, password: await bcrypt.hash("x", 4) } });
    project = await prisma.project.create({ data: { name: `Edge Case ${suffix}`, slug: `sync-edge-${suffix}`, ownerId: user.id } });
    workspace = await prisma.workspace.create({ data: { name: `Edge Case WS ${suffix}`, slug: `sync-edge-ws-${suffix}`, ownerId: user.id } });
    dataSource = await prisma.dataSource.create({
      data: { projectId: project.id, workspaceId: workspace.id, name: `Edge Case DS ${suffix}`, provider: "POSTGRESQL", host: "unused", port: 5432, database: "unused", username: "unused", encryptedPassword: encrypt("unused") },
    });
  });

  after(async () => {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  it("skips a discovered lineage record whose target was not synced as an asset, instead of crashing or dangling", async () => {
    const introspect = {
      introspectSchema: async () => [{ schema: "public", tableName: "orders", relationKind: "TABLE", columns: [{ name: "id", dataType: "uuid", isNullable: false, ordinal: 0 }] }],
      // References a table introspectSchema did not report — e.g. a foreign table, which PostgreSQL can show a dependency on but which sync never creates an asset for.
      introspectLineage: async () => [{ source: { schema: "public", name: "external_ftw_table", type: "FOREIGN_TABLE" }, target: { schema: "public", name: "orders", type: "TABLE" }, relationshipType: "READS_FROM", discoveryMethod: "FOREIGN_KEY", confidence: 1, metadata: {} }],
    };

    const summary = await syncDataSource(dataSource.id, user.id, { introspect });
    assert.equal(summary.lineageDiscovered, 1);
    assert.equal(summary.lineageCreated, 0);
    assert.equal(summary.lineageError, null);
    assert.equal(await prisma.metadataLineage.count({ where: { sourceAsset: { dataSourceId: dataSource.id } } }), 0);
  });

  it("a lineage introspection failure is reported without discarding a successful schema sync", async () => {
    const introspect = {
      introspectSchema: async () => [{ schema: "public", tableName: "widgets", relationKind: "TABLE", columns: [{ name: "id", dataType: "uuid", isNullable: false, ordinal: 0 }] }],
      introspectLineage: async () => {
        throw new Error("permission denied for schema pg_catalog");
      },
    };

    const summary = await syncDataSource(dataSource.id, user.id, { introspect });
    assert.equal(summary.assetsCreated, 1, "schema sync must still succeed");
    assert.equal(summary.lineageDiscovered, 0);
    assert.equal(summary.lineageCreated, 0);
    assert.match(summary.lineageError, /permission denied/);

    const refreshed = await prisma.dataSource.findUniqueOrThrow({ where: { id: dataSource.id } });
    assert.equal(refreshed.status, "ACTIVE", "a lineage-only failure must not flip the whole data source into ERROR");
  });
});
