// src/ai/tools/getIncidentTool.js
// Provider-agnostic tool: fetch an investigation/incident record.

import { getInvestigation } from "../../modules/investigation/investigation.service.js";

/**
 * @param {object} input
 * @param {string} input.userId - authenticated user making the request (required for workspace scoping)
 * @param {string} input.incidentId
 * @returns {Promise<object>} the DataIncident record
 */
export async function getIncidentTool({ userId, incidentId }) {
  return getInvestigation(incidentId, userId);
}
