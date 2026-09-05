// src/ai/providers/fireworksProvider.js
// Thin client for Fireworks AI's OpenAI-compatible chat completions
// endpoint. No SDK dependency — a single fetch call is enough.

import { env } from "../../config/env.js";

const ENDPOINT = "https://api.fireworks.ai/inference/v1/chat/completions";

export function isConfigured() {
  return Boolean(env.FIREWORKS_API_KEY);
}

/**
 * @param {string} prompt
 * @param {{ maxTokens?: number, temperature?: number }} [opts]
 * @returns {Promise<string>}
 */
export async function generateText(prompt, { maxTokens = 300, temperature = 0.2 } = {}) {
  if (!isConfigured()) throw new Error("FIREWORKS_API_KEY is not set.");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.FIREWORKS_API_KEY}` },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Fireworks request failed with status ${response.status}.`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * @param {string} prompt
 * @param {{ maxTokens?: number, temperature?: number }} [opts]
 * @returns {Promise<object>}
 */
export async function generateStructured(prompt, opts = {}) {
  const text = await generateText(`${prompt}\n\nRespond with ONLY valid JSON, no markdown fences, no commentary.`, opts);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Fireworks response was not valid JSON.");
  }
}
