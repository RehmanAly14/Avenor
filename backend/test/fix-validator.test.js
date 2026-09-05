import assert from "node:assert/strict";
import test from "node:test";

import { validateSql } from "../src/ai/agents/validator/sqlValidator.js";
import * as validator from "../src/ai/agents/validator/index.js";

// ── sqlValidator (pure, structural checks) ─────────────────

test("accepts a well-formed, safe SELECT statement", () => {
  const result = validateSql('SELECT *, COALESCE("customer_status", \'Unknown\') AS "customer_status" FROM "orders";');
  assert.equal(result.blocked, false);
  assert.equal(result.risk, "LOW");
});

test("flags SQL that doesn't look like SQL at all", () => {
  const result = validateSql("this is not sql");
  assert.ok(result.warnings.length > 0);
});

test("blocks DROP TABLE", () => {
  const result = validateSql('DROP TABLE "orders";');
  assert.equal(result.blocked, true);
  assert.equal(result.risk, "CRITICAL");
});

test("blocks DROP DATABASE", () => {
  const result = validateSql("DROP DATABASE avenor_dev;");
  assert.equal(result.blocked, true);
  assert.equal(result.risk, "CRITICAL");
});

test("blocks TRUNCATE", () => {
  const result = validateSql('TRUNCATE "orders";');
  assert.equal(result.blocked, true);
  assert.equal(result.risk, "CRITICAL");
});

test("blocks an unrestricted DELETE with no WHERE clause", () => {
  const result = validateSql('DELETE FROM "orders";');
  assert.equal(result.blocked, true);
  assert.equal(result.risk, "CRITICAL");
});

test("allows a restricted DELETE with a WHERE clause", () => {
  const result = validateSql('DELETE FROM "orders" WHERE id = \'123\';');
  assert.equal(result.blocked, false);
});

test("blocks an unrestricted UPDATE with no WHERE clause", () => {
  const result = validateSql('UPDATE "orders" SET amount = 0;');
  assert.equal(result.blocked, true);
  assert.equal(result.risk, "CRITICAL");
});

test("allows a restricted UPDATE with a WHERE clause", () => {
  const result = validateSql('UPDATE "orders" SET amount = 0 WHERE id = \'123\';');
  assert.equal(result.blocked, false);
});

test("flags ALTER TABLE ... DROP as HIGH risk, requiring explicit approval", () => {
  const result = validateSql('ALTER TABLE "orders" DROP COLUMN "customer_status";');
  assert.equal(result.risk, "HIGH");
});

test("flags unbalanced parentheses as blocked", () => {
  const result = validateSql('SELECT COALESCE("a", "b" FROM "orders";');
  assert.equal(result.blocked, true);
});

// ── Validator agent (cross-checks against metadata context) ─

test("validates a well-formed fix that targets the correct asset and column", async () => {
  const result = await validator.run({
    fix: { fixType: "COLUMN_REMOVED", sql: 'SELECT *, COALESCE("customer_status", \'Unknown\') AS "customer_status" FROM "orders";' },
    rootAsset: { name: "orders", qualifiedName: "public.orders" },
    rootCause: { type: "COLUMN_REMOVED" },
    schemaChanges: [{ type: "COLUMN_REMOVED", column: "customer_status", severity: "HIGH" }],
  });
  assert.equal(result.valid, true);
  assert.equal(result.blocked, false);
  assert.equal(result.risk, "LOW");
});

test("blocks a fix whose SQL contains a destructive statement", async () => {
  const result = await validator.run({
    fix: { fixType: "COLUMN_REMOVED", sql: 'DROP TABLE "orders";' },
    rootAsset: { name: "orders" },
    rootCause: { type: "COLUMN_REMOVED" },
    schemaChanges: [{ type: "COLUMN_REMOVED", column: "customer_status", severity: "HIGH" }],
  });
  assert.equal(result.valid, false);
  assert.equal(result.blocked, true);
  assert.equal(result.risk, "CRITICAL");
});

test("warns when the SQL doesn't reference the known-unknown asset", async () => {
  const result = await validator.run({
    fix: { fixType: "COLUMN_REMOVED", sql: "SELECT 1;" },
    rootAsset: { name: "orders" },
    rootCause: { type: "COLUMN_REMOVED" },
    schemaChanges: [],
  });
  assert.ok(result.warnings.some((w) => w.includes("does not appear to reference the target asset")));
});

test("warns when the SQL doesn't reference the changed column", async () => {
  const result = await validator.run({
    fix: { fixType: "COLUMN_REMOVED", sql: 'SELECT * FROM "orders";' },
    rootAsset: { name: "orders" },
    rootCause: { type: "COLUMN_REMOVED" },
    schemaChanges: [{ type: "COLUMN_REMOVED", column: "customer_status", severity: "HIGH" }],
  });
  assert.ok(result.warnings.some((w) => w.includes('"customer_status"')));
});

test("passes through a MANUAL_REVIEW fix without SQL validation", async () => {
  const result = await validator.run({ fix: { fixType: "MANUAL_REVIEW", sql: "-- manual review" }, rootAsset: { name: "raw_orders" }, rootCause: { type: "NO_UPSTREAM" }, schemaChanges: [] });
  assert.equal(result.valid, true);
  assert.equal(result.blocked, false);
});
