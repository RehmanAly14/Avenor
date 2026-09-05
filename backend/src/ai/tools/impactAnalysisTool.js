// src/ai/tools/impactAnalysisTool.js
// Provider-agnostic tool: recursive downstream impact analysis for
// "what breaks if this asset changes" reasoning.

import * as intelligence from "../../modules/metadata-intelligence/metadata-intelligence.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} input.assetId
 * @returns {Promise<object>} { asset, affectedAssets, affectedDashboards, affectedModels, affectedPipelines, totalImpact }
 */
export async function impactAnalysisTool({ userId, assetId }) {
  return intelligence.getImpact(assetId, userId);
}
