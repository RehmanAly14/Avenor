// src/ai/agents/validator/safetyRules.js
// ============================================================
// Deterministic destructive-SQL pattern rules. Pure data + a couple of
// small pure helpers — no LLM involved in security checks by design.
// ============================================================

export const RISK_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/** Combine risk levels, keeping the worst (highest) one. */
export function worstRisk(risks) {
  return risks.reduce((worst, r) => (r && RISK_ORDER.indexOf(r) > RISK_ORDER.indexOf(worst) ? r : worst), "LOW");
}

// Patterns that are always blocking, regardless of context — no fix
// Avenor generates should ever need these.
export const CRITICAL_PATTERNS = [
  { pattern: /\bDROP\s+DATABASE\b/i, message: "Generated SQL contains DROP DATABASE." },
  { pattern: /\bDROP\s+TABLE\b/i, message: "Generated SQL contains DROP TABLE." },
  { pattern: /\bDROP\s+SCHEMA\b/i, message: "Generated SQL contains DROP SCHEMA." },
  { pattern: /\bTRUNCATE\b/i, message: "Generated SQL contains TRUNCATE." },
];

// Patterns that are blocking only when unrestricted (no WHERE clause) —
// checked structurally in sqlValidator.js, not by regex alone.
export const HIGH_RISK_PATTERNS = [
  { pattern: /\bALTER\s+TABLE\s+\S+\s+DROP\b/i, message: "ALTER TABLE ... DROP requires explicit human approval and is blocked from automatic proposal." },
  { pattern: /\bGRANT\b/i, message: "Generated SQL contains a GRANT statement." },
  { pattern: /\bREVOKE\b/i, message: "Generated SQL contains a REVOKE statement." },
].map((r) => ({ ...r, risk: "HIGH" }));

export const DESTRUCTIVE_PATTERNS = [...CRITICAL_PATTERNS.map((r) => ({ ...r, risk: "CRITICAL" })), ...HIGH_RISK_PATTERNS];
