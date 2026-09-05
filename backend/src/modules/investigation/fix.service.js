// src/modules/investigation/fix.service.js
// ============================================================
// Fix approval lifecycle: PROPOSED -> (VALIDATED ->) AWAITING_APPROVAL
// -> APPROVED -> PR_CREATED -> RESOLVED, or REJECTED at any point
// before a PR exists.
//
// Approval is always an explicit human action — nothing here ever
// sets fixApprovalStatus to APPROVED except approveFix(), which is
// only ever called from POST /investigations/:id/fix/approve.
// ============================================================

import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { getInvestigation } from "./investigation.service.js";
import { logEvent } from "./incident-event.service.js";
import * as validatorAgent from "../../ai/agents/validator/index.js";
import { refreshDocumentation } from "../../ai/orchestrator/index.js";
import { createIncidentPullRequest } from "../../integrations/github/github.service.js";

function assertFixExists(incident) {
  if (!incident.proposedFix) {
    throw new AppError("No fix has been proposed for this investigation yet. Run POST /investigations/:id/run first.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
}

/** @param {string} id @param {string} userId */
export async function getFix(id, userId) {
  const incident = await getInvestigation(id, userId);
  return { fix: incident.proposedFix, status: incident.fixApprovalStatus, validation: incident.fixValidation, github: incident.githubPr };
}

/** @param {string} id @param {string} userId */
export async function validateFix(id, userId) {
  const incident = await getInvestigation(id, userId);
  assertFixExists(incident);

  const result = await validatorAgent.run({
    fix: incident.proposedFix,
    rootAsset: incident.evidence?.rootAsset ?? null,
    rootCause: incident.evidence?.rootCause ?? null,
    schemaChanges: incident.evidence?.schemaChanges ?? [],
  });

  await logEvent(id, "FIX_VALIDATED", result.blocked ? "Fix validation failed — blocked from proceeding to approval." : "Fix passed validation.", result);

  const nextStatus = result.blocked ? "PROPOSED" : "AWAITING_APPROVAL";
  const updated = await prisma.dataIncident.update({ where: { id }, data: { fixValidation: result, fixApprovalStatus: nextStatus } });

  if (!result.blocked) await logEvent(id, "AWAITING_APPROVAL", "Fix is awaiting human approval.");
  await refreshDocumentation(id, userId).catch(() => {});

  return { fix: updated.proposedFix, status: updated.fixApprovalStatus, validation: updated.fixValidation };
}

/** @param {string} id @param {string} userId */
export async function approveFix(id, userId) {
  const incident = await getInvestigation(id, userId);
  assertFixExists(incident);

  if (!["VALIDATED", "AWAITING_APPROVAL"].includes(incident.fixApprovalStatus)) {
    throw new AppError("Fix must pass validation (POST /investigations/:id/fix/validate) before it can be approved.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  await prisma.dataIncident.update({ where: { id }, data: { fixApprovalStatus: "APPROVED", approvedAt: new Date(), rejectedAt: null, rejectionReason: null } });
  await logEvent(id, "FIX_APPROVED", "Fix approved by a human reviewer.", { approvedBy: userId });

  let github = null;
  let githubError = null;
  try {
    github = await createIncidentPullRequest(id, userId);
  } catch (err) {
    githubError = err.message;
  }

  await refreshDocumentation(id, userId).catch(() => {});
  const finalIncident = await getInvestigation(id, userId);
  return { fix: finalIncident.proposedFix, status: finalIncident.fixApprovalStatus, github: finalIncident.githubPr ?? github, githubError };
}

/** @param {string} id @param {string} userId @param {string} [reason] */
export async function rejectFix(id, userId, reason) {
  const incident = await getInvestigation(id, userId);
  assertFixExists(incident);

  if (["PR_CREATED", "RESOLVED"].includes(incident.fixApprovalStatus)) {
    throw new AppError("A pull request has already been created for this fix and cannot be rejected.", HTTP_STATUS.CONFLICT);
  }

  const updated = await prisma.dataIncident.update({ where: { id }, data: { fixApprovalStatus: "REJECTED", rejectedAt: new Date(), rejectionReason: reason ?? null } });
  await logEvent(id, "FIX_REJECTED", reason ? `Fix rejected: ${reason}` : "Fix rejected.", { rejectedBy: userId, reason: reason ?? null });
  await refreshDocumentation(id, userId).catch(() => {});

  return { fix: updated.proposedFix, status: updated.fixApprovalStatus };
}
