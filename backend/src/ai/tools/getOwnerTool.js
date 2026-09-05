// src/ai/tools/getOwnerTool.js
// Provider-agnostic tool: fetch a metadata owner and the assets they own.

import * as intelligence from "../../modules/metadata-intelligence/metadata-intelligence.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} input.ownerId
 * @returns {Promise<object>} the owner with its owned assets
 */
export async function getOwnerTool({ userId, ownerId }) {
  return intelligence.getOwner(ownerId, userId);
}
