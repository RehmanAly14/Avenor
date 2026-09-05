// src/ai/agents/validator/sqlValidator.js
// ============================================================
// Deterministic, structural SQL safety checks — no SQL parser
// dependency, just targeted regex/structure checks for the patterns
// that actually matter for a generated remediation proposal.
// ============================================================

import { DESTRUCTIVE_PATTERNS, worstRisk } from "./safetyRules.js";

function statements(sql) {
  return sql.split(";").map((s) => s.trim()).filter(Boolean);
}

function isUnrestrictedDelete(statement) {
  return /\bDELETE\s+FROM\b/i.test(statement) && !/\bWHERE\b/i.test(statement);
}

function isUnrestrictedUpdate(statement) {
  return /\bUPDATE\b/i.test(statement) && /\bSET\b/i.test(statement) && !/\bWHERE\b/i.test(statement);
}

function hasBalancedParens(sql) {
  let depth = 0;
  for (const ch of sql) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

const SQL_KEYWORD = /\b(SELECT|UPDATE|INSERT|ALTER|WITH|CREATE)\b/i;

/**
 * @param {string} sql
 * @returns {{blocked: boolean, risk: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", warnings: string[]}}
 */
export function validateSql(sql) {
  const warnings = [];
  let risk = "LOW";
  let blocked = false;

  if (!sql || !sql.trim()) {
    return { blocked: true, risk: "MEDIUM", warnings: ["No SQL was generated to validate."] };
  }

  if (!SQL_KEYWORD.test(sql)) {
    warnings.push("Generated SQL does not appear to contain a recognizable SQL statement.");
    risk = worstRisk([risk, "MEDIUM"]);
  }

  if (!hasBalancedParens(sql)) {
    warnings.push("Generated SQL has unbalanced parentheses.");
    risk = worstRisk([risk, "MEDIUM"]);
    blocked = true;
  }

  for (const rule of DESTRUCTIVE_PATTERNS) {
    if (rule.pattern.test(sql)) {
      warnings.push(rule.message);
      risk = worstRisk([risk, rule.risk]);
      if (rule.risk === "CRITICAL") blocked = true;
    }
  }

  for (const statement of statements(sql)) {
    if (isUnrestrictedDelete(statement)) {
      warnings.push("Generated SQL contains an unrestricted DELETE (no WHERE clause).");
      risk = worstRisk([risk, "CRITICAL"]);
      blocked = true;
    }
    if (isUnrestrictedUpdate(statement)) {
      warnings.push("Generated SQL contains an unrestricted UPDATE (no WHERE clause).");
      risk = worstRisk([risk, "CRITICAL"]);
      blocked = true;
    }
  }

  return { blocked, risk, warnings };
}
