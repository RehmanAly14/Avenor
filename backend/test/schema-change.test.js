import assert from "node:assert/strict";
import test from "node:test";

import { compareSchemas } from "../src/modules/metadata-intelligence/schema-change.service.js";

test("detects a removed column as COLUMN_REMOVED with HIGH severity", () => {
  const oldColumns = [
    { name: "customer_id", dataType: "UUID", isNullable: false },
    { name: "customer_status", dataType: "VARCHAR", isNullable: true },
    { name: "amount", dataType: "DECIMAL", isNullable: false },
  ];
  const newColumns = [
    { name: "customer_id", dataType: "UUID", isNullable: false },
    { name: "amount", dataType: "DECIMAL", isNullable: false },
  ];

  const { changes } = compareSchemas(oldColumns, newColumns);
  const removed = changes.find((c) => c.type === "COLUMN_REMOVED");
  assert.ok(removed, "expected a COLUMN_REMOVED change");
  assert.equal(removed.column, "customer_status");
  assert.equal(removed.severity, "HIGH");
});

test("detects an added column as COLUMN_ADDED with LOW severity", () => {
  const { changes } = compareSchemas(
    [{ name: "id", dataType: "UUID" }],
    [{ name: "id", dataType: "UUID" }, { name: "email", dataType: "VARCHAR" }]
  );
  const added = changes.find((c) => c.type === "COLUMN_ADDED");
  assert.ok(added);
  assert.equal(added.column, "email");
  assert.equal(added.severity, "LOW");
});

test("detects a data type change as TYPE_CHANGED with HIGH severity", () => {
  const { changes } = compareSchemas(
    [{ name: "amount", dataType: "DECIMAL" }],
    [{ name: "amount", dataType: "VARCHAR" }]
  );
  const change = changes.find((c) => c.type === "TYPE_CHANGED");
  assert.ok(change);
  assert.equal(change.from, "DECIMAL");
  assert.equal(change.to, "VARCHAR");
  assert.equal(change.severity, "HIGH");
});

test("nullable -> NOT NULL is HIGH severity, NOT NULL -> nullable is LOW severity", () => {
  const tightened = compareSchemas([{ name: "note", dataType: "TEXT", isNullable: true }], [{ name: "note", dataType: "TEXT", isNullable: false }]);
  assert.equal(tightened.changes[0].type, "NULLABLE_CHANGED");
  assert.equal(tightened.changes[0].severity, "HIGH");

  const relaxed = compareSchemas([{ name: "note", dataType: "TEXT", isNullable: false }], [{ name: "note", dataType: "TEXT", isNullable: true }]);
  assert.equal(relaxed.changes[0].type, "NULLABLE_CHANGED");
  assert.equal(relaxed.changes[0].severity, "LOW");
});

test("detects a likely rename instead of a drop + add for same-type columns with similar names", () => {
  const { changes } = compareSchemas(
    [{ name: "customer_email", dataType: "VARCHAR" }],
    [{ name: "email", dataType: "VARCHAR" }]
  );
  assert.equal(changes.length, 1);
  assert.equal(changes[0].type, "COLUMN_RENAMED");
  assert.equal(changes[0].previousColumn, "customer_email");
  assert.equal(changes[0].column, "email");
});

test("unchanged schemas produce no changes", () => {
  const columns = [{ name: "id", dataType: "UUID", isNullable: false }];
  const { changes } = compareSchemas(columns, columns);
  assert.deepEqual(changes, []);
});
