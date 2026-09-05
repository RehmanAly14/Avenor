// src/ai/tools/metadataSearchTool.js
// Provider-agnostic tool: search the metadata graph (assets, columns,
// owners, tags, domains). Wraps the Metadata Intelligence Engine —
// no LLM SDK coupling here.

import * as intelligence from "../../modules/metadata-intelligence/metadata-intelligence.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} input.q - search text
 * @param {string} [input.projectId]
 * @param {string} [input.workspaceId]
 * @param {number} [input.page]
 * @param {number} [input.limit]
 * @returns {Promise<{items: object[], total: number}>}
 */
export async function metadataSearchTool({ userId, q, projectId, workspaceId, page = 1, limit = 20 }) {
  const result = await intelligence.search(userId, { q, projectId, workspaceId, page, limit });
  return { items: result.items, total: result.total };
}
