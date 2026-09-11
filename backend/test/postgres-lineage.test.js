import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it, before, after } from "node:test";
import pg from "pg";

import { introspectSchema, introspectLineage } from "../src/integrations/postgres/postgres.introspect.js";

const { Client } = pg;

// These tests exercise the raw PostgreSQL system-catalog queries directly —
// no Avenor app models involved — against a real, disposable schema created
// on the same database the test suite already uses (DIRECT_URL, the
// session-mode connection migrations use, since DDL needs a real session
// rather than the pgbouncer transaction pooler).
const hasDb = Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL);

function connectionConfig() {
  const url = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
  return { host: url.hostname, port: Number(url.port), database: url.pathname.slice(1), username: url.username, password: decodeURIComponent(url.password) };
}

async function withRawClient(fn) {
  const config = connectionConfig();
  const client = new Client({ host: config.host, port: config.port, database: config.database, user: config.username, password: config.password });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

describe("PostgreSQL Level 1 lineage introspection", { skip: !hasDb && "DIRECT_URL/DATABASE_URL is not configured" }, () => {
  const suffix = randomUUID().slice(0, 8).replace(/-/g, "");
  const schema = `lineage_test_${suffix}`;
  const config = connectionConfig();

  before(async () => {
    await withRawClient(async (client) => {
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`CREATE TABLE ${schema}.customers (id uuid PRIMARY KEY, name text)`);
      await client.query(`CREATE TABLE ${schema}.products (id uuid PRIMARY KEY, sku text)`);
      // Composite foreign key — the exact case information_schema.constraint_column_usage is documented to potentially misorder.
      await client.query(`CREATE TABLE ${schema}.regions (country text, code text, name text, PRIMARY KEY (country, code))`);
      await client.query(`
        CREATE TABLE ${schema}.orders (
          id uuid PRIMARY KEY,
          customer_id uuid REFERENCES ${schema}.customers(id),
          product_id uuid REFERENCES ${schema}.products(id),
          country text, region_code text,
          amount numeric,
          FOREIGN KEY (country, region_code) REFERENCES ${schema}.regions(country, code)
        )
      `);
      await client.query(`CREATE VIEW ${schema}.revenue_model AS SELECT customer_id, sum(amount) AS total FROM ${schema}.orders GROUP BY customer_id`);
      await client.query(`CREATE MATERIALIZED VIEW ${schema}.monthly_revenue AS SELECT * FROM ${schema}.revenue_model`);
    });
  });

  after(async () => {
    await withRawClient((client) => client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`));
  });

  it("discovers tables, views, and materialized views with their columns", async () => {
    const tables = (await introspectSchema(config)).filter((t) => t.schema === schema);
    const byName = Object.fromEntries(tables.map((t) => [t.tableName, t]));

    assert.equal(byName.customers.relationKind, "TABLE");
    assert.deepEqual(byName.customers.columns.map((c) => c.name), ["id", "name"]);

    assert.equal(byName.revenue_model.relationKind, "VIEW");
    assert.ok(byName.revenue_model.columns.some((c) => c.name === "total"));

    assert.equal(byName.monthly_revenue.relationKind, "MATERIALIZED_VIEW");
    assert.ok(byName.monthly_revenue.columns.some((c) => c.name === "customer_id"), "materialized view columns must be discovered even though information_schema omits matviews entirely");
  });

  it("detects a single-column foreign key as a normalized READS_FROM record", async () => {
    const lineage = (await introspectLineage(config)).filter((l) => l.source.schema === schema || l.target.schema === schema);
    const fk = lineage.find((l) => l.discoveryMethod === "FOREIGN_KEY" && l.source.name === "customers" && l.target.name === "orders");
    assert.ok(fk, "expected a customers -> orders foreign-key lineage record");
    assert.equal(fk.relationshipType, "READS_FROM");
    assert.equal(fk.confidence, 1);
    assert.deepEqual(fk.metadata.sourceColumns, ["id"]);
    assert.deepEqual(fk.metadata.targetColumns, ["customer_id"]);
  });

  it("detects multiple foreign keys on the same table independently", async () => {
    const lineage = (await introspectLineage(config)).filter((l) => l.discoveryMethod === "FOREIGN_KEY" && l.target.schema === schema && l.target.name === "orders");
    const sources = lineage.map((l) => l.source.name).sort();
    assert.deepEqual(sources, ["customers", "products", "regions"]);
  });

  it("preserves column order for a composite (multi-column) foreign key", async () => {
    const lineage = (await introspectLineage(config)).filter((l) => l.discoveryMethod === "FOREIGN_KEY" && l.source.name === "regions" && l.target.name === "orders");
    assert.equal(lineage.length, 1);
    assert.deepEqual(lineage[0].metadata.sourceColumns, ["country", "code"]);
    assert.deepEqual(lineage[0].metadata.targetColumns, ["country", "region_code"]);
  });

  it("detects a view's dependency on its base table as DERIVED_FROM", async () => {
    const lineage = await introspectLineage(config);
    const dep = lineage.find((l) => l.discoveryMethod === "VIEW_DEPENDENCY" && l.source.name === "orders" && l.target.name === "revenue_model" && l.source.schema === schema);
    assert.ok(dep);
    assert.equal(dep.relationshipType, "DERIVED_FROM");
    assert.equal(dep.source.type, "TABLE");
    assert.equal(dep.target.type, "VIEW");
  });

  it("detects a materialized view's dependency on the view it's built from", async () => {
    const lineage = await introspectLineage(config);
    const dep = lineage.find((l) => l.discoveryMethod === "VIEW_DEPENDENCY" && l.source.name === "revenue_model" && l.target.name === "monthly_revenue" && l.target.schema === schema);
    assert.ok(dep, "expected revenue_model -> monthly_revenue, proving materialized views surface through the same pg_depend/pg_rewrite mechanism as ordinary views");
    assert.equal(dep.target.type, "MATERIALIZED_VIEW");
  });

  it("returns no lineage for a schema with no relationships", async () => {
    const isolatedSchema = `${schema}_isolated`;
    await withRawClient(async (client) => {
      await client.query(`CREATE SCHEMA ${isolatedSchema}`);
      await client.query(`CREATE TABLE ${isolatedSchema}.standalone (id uuid PRIMARY KEY)`);
    });
    try {
      const lineage = (await introspectLineage(config)).filter((l) => l.source.schema === isolatedSchema || l.target.schema === isolatedSchema);
      assert.deepEqual(lineage, []);
    } finally {
      await withRawClient((client) => client.query(`DROP SCHEMA IF EXISTS ${isolatedSchema} CASCADE`));
    }
  });

  it("distinguishes same-named tables across different schemas", async () => {
    const otherSchema = `${schema}_other`;
    await withRawClient(async (client) => {
      await client.query(`CREATE SCHEMA ${otherSchema}`);
      await client.query(`CREATE TABLE ${otherSchema}.orders (id uuid PRIMARY KEY)`);
    });
    try {
      const tables = await introspectSchema(config);
      const ours = tables.find((t) => t.schema === schema && t.tableName === "orders");
      const theirs = tables.find((t) => t.schema === otherSchema && t.tableName === "orders");
      assert.ok(ours && theirs, "both same-named tables must be discovered independently");
      assert.notDeepEqual(ours.columns, theirs.columns);
    } finally {
      await withRawClient((client) => client.query(`DROP SCHEMA IF EXISTS ${otherSchema} CASCADE`));
    }
  });
});
