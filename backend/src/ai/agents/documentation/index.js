// src/ai/agents/documentation/index.js
// ============================================================
// Documentation Agent — final pipeline stage, and the record that
// turns every investigation into reusable organizational knowledge.
//
// Assembles a structured incident knowledge record from the outputs
// of every prior stage (investigation, impact, fix, validation,
// GitHub PR). Since DataHub has been removed, this record is stored
// directly on the DataIncident row (documentation Json column) —
// Avenor's own PostgreSQL database is the knowledge base.
//
// Called once at the end of the initial pipeline run, and again
// (via orchestrator.refreshDocumentation) whenever validation,
// approval, or PR creation add new information — so the record always
// reflects the incident's current state, not just its state at the
// moment the fix was first proposed.
//
// The narrative `summary` is the only field optionally enriched by the
// AI provider; every other field is assembled deterministically from
// already-computed facts (never invented), with a deterministic
// fallback summary when no provider is configured.
// ============================================================

import * as provider from "../../providers/index.js";
import { bucketAssetsByCategory } from "../impact/index.js";

function buildRecommendations({ impactBuckets, owners, fix }) {
  const recs = [];
  if (owners?.length) recs.push(`Notify ${owners.map((o) => o.name).join(", ")} before applying any fix.`);
  if (impactBuckets.dashboards.length) recs.push(`Verify ${impactBuckets.dashboards.length} downstream dashboard(s) after the fix is applied.`);
  if (fix && fix.fixType !== "MANUAL_REVIEW") recs.push("Review the proposed SQL in a staging environment before merging.");
  else if (fix) recs.push("Escalate to the asset owner for manual investigation — no automated fix was available.");
  recs.push("This report was generated automatically and requires human review before any action is taken.");
  return recs;
}

async function buildSummary({ incident, rootCauseAssetName, rootCause, impactBuckets, totalAffected, deterministic }) {
  if (!provider.isConfigured()) return deterministic;
  try {
    const prompt = [
      "Summarize this already-diagnosed data incident in 2-3 sentences for a knowledge base entry. Do not invent facts beyond what is given.",
      `Incident: ${incident?.title}`,
      `Root cause asset: ${rootCauseAssetName}`,
      `Root cause: ${rootCause?.description}`,
      `Downstream impact: ${totalAffected} asset(s) — ${impactBuckets.dashboards.length} dashboard(s), ${impactBuckets.mlModels.length} model(s), ${impactBuckets.pipelines.length} pipeline(s).`,
    ].join("\n");
    const text = await provider.generateText(prompt, { maxTokens: 200 });
    return text?.trim() || deterministic;
  } catch {
    return deterministic;
  }
}

/**
 * @param {object} context
 * @param {object} context.incident - the DataIncident record
 * @param {string} [context.reportedAssetName] - the asset originally named in the incident report
 * @param {string} [context.rootCauseAssetName] - the traced root-cause asset (may differ from reported)
 * @param {object} [context.rootCause] - Investigator agent rootCause { type, confidence, description, column? }
 * @param {string[]} [context.lineage] - ordered asset-name chain, upstream -> root cause -> downstream
 * @param {object[]} [context.schemaChanges]
 * @param {object[]} [context.impactAssets] - flat hydrated impact list (from the Impact agent's `assets`)
 * @param {object} [context.fix] - Fixer agent output
 * @param {object} [context.validation] - Validator agent output, if the fix has been validated yet
 * @param {object} [context.github] - { branch, prUrl, prNumber }, if a PR has been created yet
 * @param {string} [context.status] - current fix/resolution status to record
 * @param {object[]} [context.owners]
 * @returns {Promise<object>} structured incident documentation record
 */
export async function run({ incident, reportedAssetName, rootCauseAssetName, rootCause, lineage = [], schemaChanges = [], impactAssets = [], fix, validation = null, github = null, status, owners = [] }) {
  const impactBuckets = bucketAssetsByCategory(impactAssets);
  const deterministicSummary = `${rootCause?.description ?? "Root cause undetermined."} Affects ${impactAssets.length} downstream asset(s) (${impactBuckets.dashboards.length} dashboard(s), ${impactBuckets.mlModels.length} model(s), ${impactBuckets.pipelines.length} pipeline(s)).`;

  return {
    incident: incident?.title ?? null,
    reportedAsset: reportedAssetName ?? null,
    rootCauseAsset: rootCauseAssetName ?? null,
    rootCause: rootCause?.description ?? "Root cause undetermined.",
    lineage,
    schemaChanges,
    impact: impactBuckets,
    fix: fix ? { type: fix.fixType, summary: fix.summary, sql: fix.sql, tests: fix.tests } : null,
    validation,
    github,
    resolution: { status: status ?? "PROPOSED", timestamp: new Date().toISOString() },

    // Additive fields beyond the core knowledge-record shape — useful for
    // the frontend timeline/summary view, harmless to include.
    owner: owners.map((o) => o.name).join(", ") || "Unassigned",
    recommendations: buildRecommendations({ impactBuckets, owners, fix }),
    summary: await buildSummary({ incident, rootCauseAssetName, rootCause, impactBuckets, totalAffected: impactAssets.length, deterministic: deterministicSummary }),
  };
}
