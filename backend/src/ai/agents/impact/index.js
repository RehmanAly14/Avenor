// src/ai/agents/impact/index.js
// ============================================================
// Impact Agent.
//
// Reshapes downstream impact data into category counts + a risk
// level. Reuses the existing impact analysis implementation
// (impactAnalysisTool -> metadata-intelligence.service#getImpact) —
// no lineage traversal logic is duplicated here.
//
// When the orchestrator already has a hydrated affectedAssets list
// from the investigator stage (which itself calls getImpact), pass it
// straight through via `affectedAssets` to avoid a second DB round trip.
// ============================================================

import { impactAnalysisTool } from "../../tools/impactAnalysisTool.js";

const CATEGORIES = [
  ["dashboards", (t) => t.includes("DASHBOARD")],
  ["mlModels", (t) => t.includes("MODEL")],
  ["pipelines", (t) => t.includes("PIPELINE") || t.includes("JOB") || t.includes("ETL")],
  ["datasets", (t) => t.includes("TABLE") || t.includes("DATASET") || t.includes("VIEW")],
];

function categorize(assetType = "") {
  const type = assetType.toUpperCase();
  return CATEGORIES.find(([, test]) => test(type))?.[0] ?? null;
}

function computeRisk(totalAffected, categories) {
  if (totalAffected === 0) return "LOW";
  if (categories.dashboards > 0 || totalAffected >= 5) return "HIGH";
  return "MEDIUM";
}

/**
 * Buckets a hydrated asset list by category, keeping the full asset
 * objects per bucket (not just counts) — used by the Documentation
 * agent so it doesn't re-derive its own categorization logic.
 * @param {object[]} items
 * @returns {{dashboards: object[], datasets: object[], mlModels: object[], pipelines: object[]}}
 */
export function bucketAssetsByCategory(items = []) {
  const buckets = { dashboards: [], datasets: [], mlModels: [], pipelines: [] };
  for (const asset of items) {
    const bucket = categorize(asset.assetType);
    if (bucket) buckets[bucket].push(asset);
  }
  return buckets;
}

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} [input.assetId] - required if affectedAssets is not supplied
 * @param {object[]} [input.affectedAssets] - precomputed impact list (avoids a duplicate query)
 * @returns {Promise<{summary: {totalAffected: number}, categories: object, assets: object[], risk: string}>}
 */
export async function run({ userId, assetId, affectedAssets }) {
  const items = affectedAssets ?? (await impactAnalysisTool({ userId, assetId })).affectedAssets;

  const buckets = bucketAssetsByCategory(items);
  const categories = { dashboards: buckets.dashboards.length, datasets: buckets.datasets.length, mlModels: buckets.mlModels.length, pipelines: buckets.pipelines.length };

  const totalAffected = items.length;
  return { summary: { totalAffected }, categories, assets: items, risk: computeRisk(totalAffected, categories) };
}
