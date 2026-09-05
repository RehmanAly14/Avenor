// src/ai/tools/getDownstreamLineageTool.js
// Provider-agnostic tool: recursively resolve downstream dependents
// of an asset (what would be affected if it changed).

import * as intelligence from "../../modules/metadata-intelligence/metadata-intelligence.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} input.assetId
 * @returns {Promise<{assetId: string, downstream: object[]}>}
 */
export async function getDownstreamLineageTool({ userId, assetId }) {
  const { assetId: id, downstream } = await intelligence.getDownstream(assetId, userId);
  return { assetId: id, downstream };
}
