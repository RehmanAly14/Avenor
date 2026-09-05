// src/ai/agents/planner/index.js
// ============================================================
// Planner Agent — first stage of the autonomous investigation
// pipeline. Produces a structured plan and resolves the asset the
// incident report actually refers to.
//
// The planner never queries the database directly — asset resolution
// goes through metadataSearchTool (src/ai/tools), same as any other
// tool-calling agent will. No LLM call: the task list is fixed by the
// known investigation pipeline, and asset resolution is a deterministic
// search + ranking (see resolveAsset.js) so a vague or unmatched
// description fails clearly instead of guessing.
// ============================================================

import { resolveAsset } from "./resolveAsset.js";

/**
 * @param {object} context
 * @param {string} context.userId
 * @param {string} context.investigationId
 * @param {string} context.workspaceId
 * @param {string} context.projectId
 * @param {string} context.incidentDescription
 * @returns {Promise<{objective: string, assetId: string|null, assetName: string|null, assetCandidates: object[], tasks: object[]}>}
 */
export async function run({ userId, workspaceId, projectId, incidentDescription }) {
  const { asset, candidates } = await resolveAsset({ userId, workspaceId, projectId, text: incidentDescription });

  const tasks = [
    { id: "find_asset", description: `Locate the asset referenced by: "${incidentDescription}"`, priority: "high", status: asset ? "resolved" : "unresolved" },
    { id: "trace_lineage", description: "Trace upstream and downstream dependencies", priority: "high" },
    { id: "check_schema", description: "Compare recent schemas for upstream assets", priority: "high" },
    { id: "identify_owner", description: "Find responsible asset owners", priority: "medium" },
    { id: "calculate_impact", description: "Determine downstream impact", priority: "high" },
  ];

  return {
    objective: `Determine why "${incidentDescription}" is occurring`,
    assetId: asset?.id ?? null,
    assetName: asset?.name ?? null,
    assetCandidates: candidates,
    tasks,
  };
}
