// src/modules/investigation/incident-event.service.js
// ============================================================
// Append-only timeline for an investigation/incident. Written by the
// orchestrator (pipeline stages), the fix-approval service, and the
// GitHub integration — read back via GET /investigations/:id/timeline.
// ============================================================

import prisma from "../../config/prisma.js";

/**
 * @param {string} incidentId
 * @param {string} type - IncidentEventType
 * @param {string} message
 * @param {object} [metadata]
 */
export function logEvent(incidentId, type, message, metadata) {
  return prisma.incidentEvent.create({ data: { incidentId, type, message, metadata: metadata ?? undefined } });
}

/** @param {string} incidentId */
export function listEvents(incidentId) {
  return prisma.incidentEvent.findMany({ where: { incidentId }, orderBy: { createdAt: "asc" } });
}
