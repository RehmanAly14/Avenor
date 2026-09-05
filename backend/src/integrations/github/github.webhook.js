// src/integrations/github/github.webhook.js
// ============================================================
// GitHub webhook handling — signature verification, then a narrow
// `pull_request` handler that recognizes merged/closed events for a
// PR Avenor itself opened.
//
// Scope note (Step 12): this is the webhook *foundation*, not a full
// PR lifecycle system. It handles exactly the event this platform
// promises — a merged PR resolves its incident — and nothing beyond
// that (no re-review tracking, no comment sync, no check-run status).
// ============================================================

import crypto from "crypto";
import { env } from "../../config/env.js";
import prisma from "../../config/prisma.js";
import { logEvent } from "../../modules/investigation/incident-event.service.js";

export function isWebhookConfigured() {
  return Boolean(env.GITHUB_WEBHOOK_SECRET);
}

/**
 * @param {Buffer} rawBody - the exact raw request body GitHub signed
 * @param {string} signatureHeader - the `X-Hub-Signature-256` header value
 * @returns {boolean}
 */
export function verifySignature(rawBody, signatureHeader) {
  if (!isWebhookConfigured() || !signatureHeader || !rawBody) return false;

  const expected = `sha256=${crypto.createHmac("sha256", env.GITHUB_WEBHOOK_SECRET).update(rawBody).digest("hex")}`;
  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}

/**
 * @param {object} payload - the `pull_request` webhook payload
 * @returns {Promise<{handled: boolean, event?: string, incidentId?: string}>}
 */
export async function handlePullRequestEvent(payload) {
  const pr = payload.pull_request;
  const repoFullName = payload.repository?.full_name;
  if (!pr || !repoFullName) return { handled: false };

  const incident = await prisma.dataIncident.findFirst({
    where: { githubPr: { path: ["prNumber"], equals: pr.number } },
  });
  if (!incident || incident.githubPr?.fullName !== repoFullName) return { handled: false };

  if (payload.action === "closed" && pr.merged) {
    await logEvent(incident.id, "GITHUB_PR_MERGED", `Pull request #${pr.number} was merged.`, { prNumber: pr.number, mergedBy: pr.merged_by?.login });
    await prisma.dataIncident.update({ where: { id: incident.id }, data: { fixApprovalStatus: "RESOLVED", status: "RESOLVED" } });
    await logEvent(incident.id, "INCIDENT_RESOLVED", "Incident marked resolved after its pull request was merged.");
    return { handled: true, event: "merged", incidentId: incident.id };
  }

  if (payload.action === "closed" && !pr.merged) {
    await logEvent(incident.id, "GITHUB_PR_CLOSED", `Pull request #${pr.number} was closed without merging.`);
    return { handled: true, event: "closed", incidentId: incident.id };
  }

  return { handled: false };
}
