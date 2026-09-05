// src/ai/tools/getUpstreamLineageTool.js
// Provider-agnostic tool: recursively resolve upstream dependencies
// for an asset (sources it was derived from).

import * as intelligence from "../../modules/metadata-intelligence/metadata-intelligence.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} input.assetId
 * @returns {Promise<{assetId: string, upstream: object[]}>}
 */
export async function getUpstreamLineageTool({ userId, assetId }) {
  const { assetId: id, upstream } = await intelligence.getUpstream(assetId, userId);
  return { assetId: id, upstream };
}
