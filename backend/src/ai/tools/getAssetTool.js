// src/ai/tools/getAssetTool.js
// Provider-agnostic tool: fetch a single metadata asset with its
// schema, owners, tags, and domain.

import * as intelligence from "../../modules/metadata-intelligence/metadata-intelligence.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} input.assetId
 * @returns {Promise<object>} the metadata asset
 */
export async function getAssetTool({ userId, assetId }) {
  return intelligence.assetScope(assetId, userId);
}
