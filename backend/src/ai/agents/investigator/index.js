// src/ai/agents/investigator/index.js
// ============================================================
// Investigation Agent.
//
// Runs the deterministic Investigation Engine (src/modules/investigation)
// on the asset the incident reports as broken. If that asset has no
// direct high-confidence root cause (no schema change of its own), it
// walks upstream — closest first — checking each upstream asset's own
// schema history via the same detectSchemaChanges used by the Engine,
// until it finds one. This is what lets a report like "the dashboard
// is broken" resolve to a root cause several hops away ("customer_status
// was removed from orders").
//
// All facts come from tool calls (schema diff, lineage, impact) — the
// agent never invents an asset, owner, or schema change. No LLM call.
// ============================================================

import { analyze, detectSchemaChanges } from "../../../modules/investigation/investigation.service.js";
import { getAssetTool } from "../../tools/getAssetTool.js";
import { getUpstreamLineageTool } from "../../tools/getUpstreamLineageTool.js";
import { getDownstreamLineageTool } from "../../tools/getDownstreamLineageTool.js";
import { impactAnalysisTool } from "../../tools/impactAnalysisTool.js";

const STRONG_CONFIDENCE_THRESHOLD = 0.5;
const TRACED_ROOT_CAUSE_CONFIDENCE = 0.85;

function describeChange(change) {
  switch (change.type) {
    case "COLUMN_REMOVED":
      return `Column "${change.column}" was removed from the schema.`;
    case "COLUMN_ADDED":
      return `Column "${change.column}" was added to the schema.`;
    case "COLUMN_RENAMED":
      return `Column "${change.previousColumn}" appears to have been renamed to "${change.column}".`;
    case "TYPE_CHANGED":
      return `Column "${change.column}" changed type from ${change.from} to ${change.to}.`;
    case "NULLABLE_CHANGED":
      return `Column "${change.column}" nullability changed from ${change.from} to ${change.to}.`;
    default:
      return `${change.type} on column "${change.column}".`;
  }
}

function buildEvidence({ reportedAsset, rootAsset, schemaChanges, upstreamAssets, downstreamAssets, owners }) {
  const evidence = [];

  if (rootAsset.id !== reportedAsset.id) {
    evidence.push({ asset: reportedAsset.name, finding: `No direct schema change found on "${reportedAsset.name}"; traced upstream to "${rootAsset.name}" (${rootAsset.depth} hop(s) away).` });
  }

  for (const change of schemaChanges) evidence.push({ asset: rootAsset.name, finding: describeChange(change) });
  if (!schemaChanges.length) evidence.push({ asset: rootAsset.name, finding: "No recent schema changes were detected for this asset." });

  evidence.push({ asset: reportedAsset.name, finding: `${upstreamAssets.length} upstream and ${downstreamAssets.length} downstream asset(s) found in the lineage graph.` });
  evidence.push({ asset: rootAsset.name, finding: owners.length ? `Owned by: ${owners.map((o) => o.name).join(", ")}.` : "No registered owners found for this asset." });

  return evidence;
}

/**
 * Walk upstream assets (closest first), looking for the first one with
 * its own HIGH-severity schema change. Reuses detectSchemaChanges — the
 * exact same schema-diff logic the Investigation Engine already applies
 * to the reported asset — so there is no separate/duplicated diff logic.
 */
async function traceUpstreamRootCause(upstreamAssets) {
  const sorted = [...upstreamAssets].sort((a, b) => a.depth - b.depth);
  for (const asset of sorted) {
    const { changes } = await detectSchemaChanges(asset.id);
    const highSeverity = changes.find((c) => c.severity === "HIGH");
    if (highSeverity) return { asset, changes, highSeverity };
  }
  return null;
}

/**
 * @param {object} context
 * @param {string} context.userId
 * @param {string} context.investigationId - an existing DataIncident/investigation id
 * @param {string} context.assetId - the asset reported as the source of the problem
 * @param {string} context.problem - free-text description of the problem
 * @returns {Promise<{rootCause: object, evidence: object[], raw: object}>}
 */
export async function run({ userId, investigationId, assetId, problem }) {
  const result = await analyze(investigationId, userId, { assetId, problem });

  let rootAsset = { ...result.rootAsset, depth: 0 };
  let schemaChanges = result.schemaChanges;
  let rootCauseCandidates = result.rootCauseCandidates;
  let upstreamAssets = result.upstreamAssets;
  let downstreamAssets = result.downstreamAssets;
  let affectedAssets = result.affectedAssets;
  let owners = result.owners;

  const strongest = rootCauseCandidates.find((c) => c.confidence >= STRONG_CONFIDENCE_THRESHOLD);
  if (!strongest && result.upstreamAssets.length) {
    const traced = await traceUpstreamRootCause(result.upstreamAssets);
    if (traced) {
      rootAsset = traced.asset;
      schemaChanges = traced.changes;
      rootCauseCandidates = [{
        type: traced.highSeverity.type,
        column: traced.highSeverity.column,
        description: `${describeChange(traced.highSeverity)} This was found on "${rootAsset.name}", ${rootAsset.depth} hop(s) upstream of "${result.rootAsset.name}", and is the likely root cause.`,
        confidence: TRACED_ROOT_CAUSE_CONFIDENCE,
      }];

      // Re-anchor lineage/impact/owners on the traced root-cause asset — the
      // original analyze() result was all relative to the *reported* asset,
      // which is no longer the pivot once we've walked upstream from it.
      const [upstream, downstream, impact, fullAsset] = await Promise.all([
        getUpstreamLineageTool({ userId, assetId: rootAsset.id }),
        getDownstreamLineageTool({ userId, assetId: rootAsset.id }),
        impactAnalysisTool({ userId, assetId: rootAsset.id }),
        getAssetTool({ userId, assetId: rootAsset.id }),
      ]);
      upstreamAssets = upstream.upstream;
      downstreamAssets = downstream.downstream;
      affectedAssets = impact.affectedAssets;
      owners = fullAsset.owners;
    }
  }

  const top = rootCauseCandidates[0] ?? { type: "UNKNOWN", confidence: 0, description: "No root cause could be determined from the available metadata." };
  const rootCause = { type: top.type, confidence: top.confidence, description: top.description, ...(top.column && { column: top.column }) };

  const evidence = buildEvidence({ reportedAsset: result.rootAsset, rootAsset, schemaChanges, upstreamAssets, downstreamAssets, owners });

  return {
    rootCause,
    evidence,
    raw: { ...result, rootAsset, schemaChanges, upstreamAssets, downstreamAssets, affectedAssets, owners },
  };
}
