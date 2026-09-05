// src/ai/orchestrator/index.js
// ============================================================
// Autonomous investigation pipeline orchestrator.
//
//   Planner -> Investigator -> Impact -> Fixer -> Documentation
//
// Each stage receives the previous stage's structured output. State is
// persisted to the DataIncident row after every stage (stage, plan,
// evidence, impact, proposedFix, documentation, error) so a run can be
// inspected — or resumed from where it left off — without recomputing
// finished stages. runPipeline runs synchronously end-to-end and
// returns the final row; GET /investigations/:id/status and /report
// read the persisted state back out without recomputation.
//
// Every stage transition is also appended to the IncidentEvent
// timeline (GET /investigations/:id/timeline) — the durable "what
// happened, in order" record for the frontend's process view.
//
// `deps` lets callers (tests) substitute individual stage
// implementations — e.g. to make the Impact stage throw and verify the
// pipeline fails cleanly — without touching real modules.
//
// Fix approval and GitHub PR creation happen entirely outside this
// pipeline (src/modules/investigation/fix.service.js,
// src/integrations/github/) — this orchestrator only ever produces a
// PROPOSED fix. refreshDocumentation lets those later stages update
// the knowledge record without re-running the whole pipeline.
// ============================================================

import prisma from "../../config/prisma.js";
import { getInvestigation } from "../../modules/investigation/investigation.service.js";
import { logEvent, listEvents } from "../../modules/investigation/incident-event.service.js";
import * as plannerAgent from "../agents/planner/index.js";
import * as investigatorAgent from "../agents/investigator/index.js";
import * as impactAgent from "../agents/impact/index.js";
import * as fixerAgent from "../agents/fixer/index.js";
import * as documentationAgent from "../agents/documentation/index.js";

export const STAGES = ["PENDING", "PLANNING", "INVESTIGATING", "ANALYZING_IMPACT", "GENERATING_FIX", "DOCUMENTING", "COMPLETED", "FAILED"];

function setStage(id, stage, data = {}) {
  return prisma.dataIncident.update({ where: { id }, data: { stage, ...data } });
}

function buildLineagePath(incident) {
  const ev = incident.evidence;
  if (!ev) return [];
  const up = [...(ev.upstreamAssets ?? [])].sort((a, b) => b.depth - a.depth).map((a) => a.name);
  const down = [...(ev.downstreamAssets ?? [])].sort((a, b) => a.depth - b.depth).map((a) => a.name);
  // rootAssetName is the *traced* root-cause asset (may differ from the
  // originally-reported asset in incident.plan.assetName once the
  // investigator has walked upstream to find the real cause).
  const rootName = ev.rootAssetName ?? incident.plan?.assetName;
  return [...up, ...(rootName ? [rootName] : []), ...down];
}

function buildRecommendation(incident) {
  if (incident.stage !== "COMPLETED") return null;
  const rootCause = incident.evidence?.rootCause;
  const impactTotal = incident.impact?.summary?.totalAffected ?? 0;
  const dashboards = incident.impact?.categories?.dashboards ?? 0;
  const models = incident.impact?.categories?.mlModels ?? 0;

  let text = `Avenor identified ${rootCause?.description ?? "an undetermined root cause"}.`;
  text += ` The change affects ${impactTotal} downstream asset(s)${dashboards || models ? ` (${dashboards} dashboard(s), ${models} model(s))` : ""}.`;
  if (incident.proposedFix) {
    const validated = incident.fixValidation && !incident.fixValidation.blocked;
    text += ` A ${incident.fixApprovalStatus === "PR_CREATED" || incident.fixApprovalStatus === "RESOLVED" ? "" : "safe "}remediation has been generated${validated ? " and validated" : ""}.`;
  }
  if (incident.githubPr?.prUrl) text += ` A pull request is ready for review: ${incident.githubPr.prUrl}.`;
  else if (incident.fixApprovalStatus === "AWAITING_APPROVAL" || incident.fixApprovalStatus === "PROPOSED") {
    text += " Awaiting human approval before a pull request is opened.";
  }
  return text;
}

/**
 * Rebuilds and persists the documentation knowledge record from the
 * incident's current persisted state (no recomputation of lineage/
 * impact — just re-assembly). Called at the end of the pipeline, and
 * again by fix.service.js / github.service.js whenever validation,
 * approval, or PR creation add new information.
 *
 * @param {string} investigationId
 * @param {string} userId
 * @param {object} [deps]
 * @returns {Promise<object>} the updated DataIncident row
 */
export async function refreshDocumentation(investigationId, userId, deps = {}) {
  const documentationStage = deps.documentation ?? documentationAgent;
  const incident = await getInvestigation(investigationId, userId);

  const documentation = await documentationStage.run({
    incident,
    reportedAssetName: incident.plan?.assetName ?? null,
    rootCauseAssetName: incident.evidence?.rootAssetName ?? null,
    rootCause: incident.evidence?.rootCause ?? null,
    lineage: buildLineagePath(incident),
    schemaChanges: incident.evidence?.schemaChanges ?? [],
    impactAssets: incident.impact?.assets ?? [],
    fix: incident.proposedFix,
    validation: incident.fixValidation,
    github: incident.githubPr,
    status: incident.fixApprovalStatus ?? incident.status,
    owners: incident.evidence?.owners ?? [],
  });

  await logEvent(investigationId, "DOCUMENTATION_GENERATED", "Incident documentation record updated.");
  return prisma.dataIncident.update({ where: { id: investigationId }, data: { documentation } });
}

/**
 * Run the full autonomous investigation pipeline against an existing
 * investigation. Throws (404/403) only for an invalid/inaccessible
 * investigationId; any failure inside a pipeline stage is caught and
 * recorded as InvestigationStage.FAILED with a human-readable error,
 * not thrown.
 *
 * @param {object} context
 * @param {string} context.investigationId
 * @param {string} context.userId
 * @param {object} [deps] - stage overrides, for testing failure paths
 * @returns {Promise<object>} the final DataIncident row
 */
export async function runPipeline({ investigationId, userId }, deps = {}) {
  const stages = {
    planner: deps.planner ?? plannerAgent,
    investigator: deps.investigator ?? investigatorAgent,
    impact: deps.impact ?? impactAgent,
    fixer: deps.fixer ?? fixerAgent,
    documentation: deps.documentation ?? documentationAgent,
  };

  const incident = await getInvestigation(investigationId, userId);

  try {
    await setStage(investigationId, "PLANNING", { error: null });
    await logEvent(investigationId, "INVESTIGATION_STARTED", `Started investigating: "${incident.title}".`);

    const incidentDescription = [incident.title, incident.description].filter(Boolean).join(". ");
    const plan = await stages.planner.run({ userId, investigationId, workspaceId: incident.workspaceId, projectId: incident.projectId, incidentDescription });
    await setStage(investigationId, "INVESTIGATING", { plan });

    if (!plan.assetId) {
      const error = `Could not resolve an asset referenced by this incident's title/description. Provide a more specific title, or call POST /investigations/${investigationId}/analyze with an explicit assetId.`;
      await logEvent(investigationId, "ASSET_RESOLVED", error, { resolved: false });
      return setStage(investigationId, "FAILED", { error });
    }
    await logEvent(investigationId, "ASSET_RESOLVED", `Resolved asset "${plan.assetName}" from the incident description.`, { assetId: plan.assetId, assetName: plan.assetName });

    const evidenceResult = await stages.investigator.run({ userId, investigationId, assetId: plan.assetId, problem: incidentDescription });
    await setStage(investigationId, "ANALYZING_IMPACT", {
      evidence: {
        rootCause: evidenceResult.rootCause,
        evidence: evidenceResult.evidence,
        rootAsset: evidenceResult.raw.rootAsset,
        rootAssetName: evidenceResult.raw.rootAsset.name,
        schemaChanges: evidenceResult.raw.schemaChanges,
        upstreamAssets: evidenceResult.raw.upstreamAssets,
        downstreamAssets: evidenceResult.raw.downstreamAssets,
        owners: evidenceResult.raw.owners,
      },
    });
    await logEvent(investigationId, "ROOT_CAUSE_FOUND", evidenceResult.rootCause.description, evidenceResult.rootCause);

    const impact = await stages.impact.run({ userId, affectedAssets: evidenceResult.raw.affectedAssets });
    await setStage(investigationId, "GENERATING_FIX", { impact });
    await logEvent(investigationId, "IMPACT_ANALYZED", `${impact.summary.totalAffected} downstream asset(s) affected (risk: ${impact.risk}).`, impact.summary);

    const proposedFix = await stages.fixer.run({
      rootCause: evidenceResult.rootCause,
      schemaChanges: evidenceResult.raw.schemaChanges,
      rootAsset: evidenceResult.raw.rootAsset,
      downstreamAssets: evidenceResult.raw.downstreamAssets,
      impact,
    });
    await setStage(investigationId, "DOCUMENTING", { proposedFix, fixApprovalStatus: "PROPOSED" });
    await logEvent(investigationId, "FIX_GENERATED", proposedFix.summary, { fixType: proposedFix.fixType, risk: proposedFix.risk });

    const documentation = await stages.documentation.run({
      incident,
      reportedAssetName: plan.assetName,
      rootCauseAssetName: evidenceResult.raw.rootAsset.name,
      rootCause: evidenceResult.rootCause,
      lineage: buildLineagePath({ evidence: { upstreamAssets: evidenceResult.raw.upstreamAssets, downstreamAssets: evidenceResult.raw.downstreamAssets, rootAssetName: evidenceResult.raw.rootAsset.name } }),
      schemaChanges: evidenceResult.raw.schemaChanges,
      impactAssets: impact.assets,
      fix: proposedFix,
      validation: null,
      github: null,
      status: "PROPOSED",
      owners: evidenceResult.raw.owners,
    });
    await logEvent(investigationId, "DOCUMENTATION_GENERATED", "Incident documentation record generated.");

    return setStage(investigationId, "COMPLETED", { documentation });
  } catch (err) {
    return setStage(investigationId, "FAILED", { error: err.message });
  }
}

/**
 * @param {string} investigationId
 * @param {string} userId
 * @returns {Promise<{investigationId: string, stage: string, status: string, error: string|null}>}
 */
export async function getStatus(investigationId, userId) {
  const incident = await getInvestigation(investigationId, userId);
  return { investigationId: incident.id, stage: incident.stage, status: incident.status, fixApprovalStatus: incident.fixApprovalStatus, error: incident.error };
}

/**
 * Reads the persisted pipeline state back out — no recomputation.
 * @param {string} investigationId
 * @param {string} userId
 * @returns {Promise<object>} structured final investigation report
 */
export async function getReport(investigationId, userId) {
  const incident = await getInvestigation(investigationId, userId);
  const timeline = await listEvents(investigationId);

  return {
    complete: incident.stage === "COMPLETED",
    stage: incident.stage,
    error: incident.error,
    incident: { id: incident.id, title: incident.title, description: incident.description, severity: incident.severity, status: incident.status },
    investigation: { stage: incident.stage, fixApprovalStatus: incident.fixApprovalStatus },
    plan: incident.plan,
    rootCause: incident.evidence?.rootCause ?? null,
    evidence: incident.evidence?.evidence ?? [],
    schemaChanges: incident.evidence?.schemaChanges ?? [],
    lineage: buildLineagePath(incident),
    impact: incident.impact,
    proposedFix: incident.proposedFix,
    validation: incident.fixValidation,
    github: incident.githubPr,
    documentation: incident.documentation,
    timeline,
    recommendation: buildRecommendation(incident),
  };
}

// Reserved for direct/standalone agent access from outside the HTTP layer.
export { plannerAgent as planner, investigatorAgent as investigator, impactAgent as impact, fixerAgent as fixer, documentationAgent as documentation };
