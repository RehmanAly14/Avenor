// src/ai/agents/validator/index.js
// ============================================================
// Fix Validation / Safety Agent.
//
// Deterministic gate between "the Fixer proposed something" and "a
// human can approve it". Every check here is a plain function over
// data already computed by earlier pipeline stages — no LLM is asked
// to perform security checks; an LLM is a poor, non-deterministic fit
// for judging whether SQL is destructive.
// ============================================================

import { validateSql } from "./sqlValidator.js";
import { worstRisk } from "./safetyRules.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {object} context
 * @param {object} context.fix - Fixer agent output { fixType, sql, ... } (or the legacy { fix: { type, content } } shape)
 * @param {object} [context.rootAsset] - { name, qualifiedName } the fix should target
 * @param {object} [context.rootCause] - Investigator rootCause { type, ... }
 * @param {object[]} [context.schemaChanges]
 * @returns {Promise<{valid: boolean, risk: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", warnings: string[], blocked: boolean}>}
 */
export async function run({ fix, rootAsset, rootCause, schemaChanges = [] }) {
  const fixType = fix?.fixType ?? fix?.fix?.type;
  const sql = fix?.sql ?? fix?.fix?.content ?? "";

  if (fixType === "MANUAL_REVIEW") {
    return { valid: true, risk: "LOW", warnings: ["No SQL was generated — this fix requires manual review, not automated validation."], blocked: false };
  }

  const warnings = [];
  let risk = "LOW";

  const sqlResult = validateSql(sql);
  warnings.push(...sqlResult.warnings);
  risk = worstRisk([risk, sqlResult.risk]);
  let blocked = sqlResult.blocked;

  // The generated SQL must actually target the asset the root cause was found on.
  const tableRef = (rootAsset?.qualifiedName || rootAsset?.name || "").split(".").pop();
  if (tableRef && !new RegExp(escapeRegExp(tableRef), "i").test(sql)) {
    warnings.push(`Generated SQL does not appear to reference the target asset "${rootAsset?.name}".`);
    risk = worstRisk([risk, "MEDIUM"]);
  }

  // The changed column the root cause names must be explicitly handled by the fix.
  const changedColumn = schemaChanges.find((c) => c.severity === "HIGH")?.column ?? schemaChanges[0]?.column;
  if (changedColumn && !sql.includes(changedColumn)) {
    warnings.push(`Generated SQL does not reference the changed column "${changedColumn}".`);
    risk = worstRisk([risk, "MEDIUM"]);
  }

  // The fix's declared type must match what the investigation actually found.
  if (fixType && rootCause?.type && fixType !== rootCause.type && rootCause.type !== "UNKNOWN") {
    warnings.push(`Fix type "${fixType}" does not match the detected root cause type "${rootCause.type}".`);
    risk = worstRisk([risk, "MEDIUM"]);
  }

  return { valid: !blocked, risk, warnings, blocked };
}
