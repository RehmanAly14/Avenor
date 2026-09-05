// src/ai/agents/planner/resolveAsset.js
// Resolves a free-text incident description ("Monthly Revenue dashboard
// is broken") to a metadata asset, using only metadataSearchTool — the
// planner never queries Prisma directly. Deterministic keyword search +
// name-overlap ranking; no LLM, so it never invents an asset that isn't
// actually in the metadata graph.

import { metadataSearchTool } from "../../tools/metadataSearchTool.js";

const STOPWORDS = new Set([
  "a", "an", "the", "is", "was", "were", "are", "be", "been", "being",
  "has", "have", "had", "on", "in", "at", "after", "before", "and", "or",
  "to", "of", "for", "that", "this", "it", "its", "broken", "broke",
  "breaking", "fails", "failed", "failing", "error", "errors", "issue",
  "issues", "problem", "problems", "started", "start", "yesterday",
  "today", "deployment", "deploy", "showing", "show", "shows", "not",
  "working", "down", "something", "somewhere", "wrong", "seems", "seem",
]);

function extractKeywords(text) {
  const words = (text || "").toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(words)].filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function overlapScore(assetName, titleWords) {
  const nameWords = normalize(assetName).split(" ").filter(Boolean);
  return nameWords.filter((w) => titleWords.includes(w)).length;
}

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.workspaceId
 * @param {string} input.projectId
 * @param {string} input.text - free-text incident title/description
 * @returns {Promise<{asset: object|null, candidates: Array<{id:string,name:string,score:number}>}>}
 */
export async function resolveAsset({ userId, workspaceId, projectId, text }) {
  const keywords = extractKeywords(text);
  if (!keywords.length) return { asset: null, candidates: [] };

  const titleWords = normalize(text).split(" ").filter(Boolean);
  const seen = new Map();

  for (const keyword of keywords) {
    let results;
    try {
      results = await metadataSearchTool({ userId, q: keyword, workspaceId, projectId, limit: 5 });
    } catch {
      continue;
    }
    for (const asset of results.items) {
      if (!seen.has(asset.id)) seen.set(asset.id, asset);
    }
  }

  const candidates = [...seen.values()]
    .map((asset) => ({ asset, score: overlapScore(asset.name, titleWords) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  return {
    asset: best && best.score > 0 ? best.asset : null,
    candidates: candidates.slice(0, 5).map((c) => ({ id: c.asset.id, name: c.asset.name, score: c.score })),
  };
}
