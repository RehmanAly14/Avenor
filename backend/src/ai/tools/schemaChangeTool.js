// src/ai/tools/schemaChangeTool.js
// Provider-agnostic tool: compare two schema snapshots (or two
// MetadataSchema records) and report added/removed/renamed/type/
// nullable changes.

import * as intelligence from "../../modules/metadata-intelligence/metadata-intelligence.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} [input.oldSchemaId]
 * @param {string} [input.newSchemaId]
 * @param {Array}  [input.oldColumns]
 * @param {Array}  [input.newColumns]
 * @returns {Promise<{changes: object[]}>}
 */
export async function schemaChangeTool({ userId, oldSchemaId, newSchemaId, oldColumns, newColumns }) {
  return intelligence.compareSchema(userId, { oldSchemaId, newSchemaId, oldColumns, newColumns });
}
