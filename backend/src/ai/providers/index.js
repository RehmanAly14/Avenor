// src/ai/providers/index.js
// ============================================================
// Minimal, swappable LLM provider abstraction.
//
// Agents depend on this interface (generateText / generateStructured),
// never on a specific vendor SDK. Selection is env-driven:
//
//   AI_PROVIDER=fireworks
//   AI_MODEL=accounts/fireworks/models/...
//   FIREWORKS_API_KEY=...
//
// When AI_PROVIDER is unset (default), isConfigured() returns false
// and callers are expected to fall back to their deterministic
// template — the pipeline's factual output never depends on a
// provider being configured, only its prose is optionally enriched.
// ============================================================

import { env } from "../../config/env.js";
import * as fireworks from "./fireworksProvider.js";

const PROVIDERS = { fireworks };

function activeProvider() {
  return PROVIDERS[env.AI_PROVIDER];
}

export function isConfigured() {
  const provider = activeProvider();
  return Boolean(provider && provider.isConfigured());
}

/** @param {string} prompt @param {object} [opts] @returns {Promise<string>} */
export async function generateText(prompt, opts = {}) {
  const provider = activeProvider();
  if (!provider) throw new Error(`AI provider "${env.AI_PROVIDER || "(none)"}" is not configured.`);
  return provider.generateText(prompt, opts);
}

/** @param {string} prompt @param {object} [opts] @returns {Promise<object>} */
export async function generateStructured(prompt, opts = {}) {
  const provider = activeProvider();
  if (!provider) throw new Error(`AI provider "${env.AI_PROVIDER || "(none)"}" is not configured.`);
  return provider.generateStructured(prompt, opts);
}
