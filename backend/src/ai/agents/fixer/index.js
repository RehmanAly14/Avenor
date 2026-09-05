// src/ai/agents/fixer/index.js
// ============================================================
// Fixer Agent — proposal mode only.
//
// The fix (SQL, tests, files) and its risk are always produced
// deterministically from the schema change already detected by the
// Investigator — never invented. The AI provider (if configured) is
// only ever asked to elaborate the prose explanation of facts that are
// already computed; on any provider error, or when no provider is
// configured, a deterministic template explanation is used instead.
// Deterministic safety rules (src/ai/agents/validator) are always
// authoritative over anything an LLM adds — a validated/blocked
// verdict never depends on the provider being configured.
//
// SAFETY: this agent only ever returns a proposal. It never executes
// SQL, never touches a database connection, and every fix is returned
// with status "PROPOSED".
// ============================================================

import * as provider from "../../providers/index.js";

function defaultValueFor(dataType = "") {
  return /int|numeric|decimal|float|double|bigint/i.test(dataType) ? "0" : "''";
}

// qualifiedName conventionally holds dotted schema.table notation — quote
// each segment separately so it stays valid multi-part SQL rather than one
// escaped identifier containing a literal dot.
function quoteTableRef(ref) {
  return ref.split(".").map((part) => `"${part}"`).join(".");
}

function assetSlug(rootAsset) {
  return (rootAsset?.name || "asset").toLowerCase().replace(/[^a-z0-9_]+/g, "_");
}

function buildFiles(rootAsset, sql, column) {
  const slug = assetSlug(rootAsset);
  return [
    { path: `models/${slug}.sql`, content: sql },
    {
      path: `tests/${slug}.yml`,
      content: [
        "version: 2",
        "models:",
        `  - name: ${slug}`,
        "    columns:",
        `      - name: ${column || "affected_column"}`,
        "        tests:",
        "          - not_null",
      ].join("\n"),
    },
  ];
}

function buildFix(change, rootAsset) {
  const table = quoteTableRef(rootAsset?.qualifiedName || rootAsset?.name || "the_table");

  if (!change) {
    const sql = `-- No deterministic schema change was found for ${table}.\n-- Manual investigation of the upstream source is recommended before proposing a fix.`;
    return {
      fixType: "MANUAL_REVIEW",
      summary: `No automated fix template applies to "${rootAsset?.name}" — manual review required.`,
      sql,
      tests: [`Manual verification of "${rootAsset?.name}" data freshness and upstream source health.`],
      files: [],
      risk: "MEDIUM",
      whyFixWorks: "No automatic fix could be generated because no high-confidence schema change was detected.",
    };
  }

  switch (change.type) {
    case "COLUMN_REMOVED": {
      const sql = [
        "SELECT",
        "    *,",
        `    CASE WHEN "${change.column}" IS NULL THEN 'Unknown' ELSE "${change.column}" END AS "${change.column}"`,
        `FROM ${table};`,
        `-- NOTE: "${change.column}" no longer exists upstream — this CASE branch always resolves to 'Unknown'.`,
        `-- Confirm with the asset owner whether downstream consumers should stop referencing "${change.column}" entirely.`,
      ].join("\n");
      return {
        fixType: "COLUMN_REMOVED",
        summary: `Backfill "${change.column}" with a default value since it no longer exists upstream on ${table}.`,
        sql,
        tests: [
          `Schema compatibility test: ${table} no longer exposes "${change.column}".`,
          `Null-handling test for "${change.column}" in downstream models.`,
        ],
        files: buildFiles(rootAsset, sql, change.column),
        risk: "HIGH",
        whyFixWorks: `Falling back to a default value keeps downstream queries that still select "${change.column}" from erroring, while surfacing that the source no longer supplies it.`,
      };
    }
    case "TYPE_CHANGED": {
      const sql = [
        "SELECT",
        "    *,",
        `    CAST("${change.column}" AS ${change.from}) AS "${change.column}_legacy_type"`,
        `FROM ${table};`,
        `-- "${change.column}" changed from ${change.from} to ${change.to}; cast back to the previous type until downstream consumers migrate.`,
      ].join("\n");
      return {
        fixType: "TYPE_CHANGED",
        summary: `Cast "${change.column}" back to ${change.from} on ${table} until downstream consumers migrate to ${change.to}.`,
        sql,
        tests: [
          `Type-compatibility test for "${change.column}" (${change.from} -> ${change.to}).`,
          `Downstream cast/parse test for "${change.column}".`,
        ],
        files: buildFiles(rootAsset, sql, change.column),
        risk: "HIGH",
        whyFixWorks: `Casting back to ${change.from} keeps strict-typed downstream consumers working until they are migrated to ${change.to}.`,
      };
    }
    case "NULLABLE_CHANGED": {
      const sql = [
        "SELECT",
        "    *,",
        `    COALESCE("${change.column}", ${defaultValueFor(change.to)}) AS "${change.column}"`,
        `FROM ${table};`,
        `-- "${change.column}" is now NOT NULL upstream; this guards older rows/writers that may still send NULL.`,
      ].join("\n");
      return {
        fixType: "NULLABLE_CHANGED",
        summary: `Coalesce "${change.column}" to a default on ${table} to guard rows/writers that predate the NOT NULL constraint.`,
        sql,
        tests: [
          `Null-constraint regression test for "${change.column}".`,
          `Default-value fallback test for "${change.column}".`,
        ],
        files: buildFiles(rootAsset, sql, change.column),
        risk: "MEDIUM",
        whyFixWorks: "Coalescing to a default keeps rows/writers that predate the NOT NULL constraint from breaking downstream queries.",
      };
    }
    case "COLUMN_RENAMED": {
      const sql = [
        "SELECT",
        "    *,",
        `    "${change.column}" AS "${change.previousColumn}" -- backward-compatible alias`,
        `FROM ${table};`,
      ].join("\n");
      return {
        fixType: "COLUMN_RENAMED",
        summary: `Alias "${change.column}" back to "${change.previousColumn}" on ${table} for consumers that haven't migrated.`,
        sql,
        tests: [`Alias compatibility test: "${change.previousColumn}" still resolves via "${change.column}".`],
        files: buildFiles(rootAsset, sql, change.column),
        risk: "MEDIUM",
        whyFixWorks: `Aliasing "${change.column}" back to "${change.previousColumn}" keeps consumers that haven't migrated to the new column name working.`,
      };
    }
    default: {
      const sql = `-- Detected change "${change.type}" on "${change.column}" has no automated fix template yet.\n-- Manual review recommended.`;
      return {
        fixType: change.type,
        summary: `"${change.type}" on "${change.column}" has no automated fix template yet.`,
        sql,
        tests: [`Manual review of "${change.column}" on ${table}.`],
        files: [],
        risk: "MEDIUM",
        whyFixWorks: `"${change.type}" is not yet covered by an automatic fix template.`,
      };
    }
  }
}

async function buildExplanation({ rootCause, primary, rootAsset, downstreamAssets, impact, deterministic }) {
  const riskNote = "This is a generated proposal — it has not been executed against any database.";
  const downstreamNote = downstreamAssets?.length ? ` Verify against ${downstreamAssets.length} downstream asset(s) before applying.` : "";
  const fallback = [rootCause?.description, deterministic.whyFixWorks, `${downstreamNote}`.trim(), riskNote].filter(Boolean).join(" ");

  if (!provider.isConfigured()) return fallback;

  try {
    const prompt = [
      "You are explaining an already-diagnosed data pipeline incident. Do not invent any facts — only elaborate in plain English on the facts given below.",
      `Asset: ${rootAsset?.name}`,
      `Root cause: ${rootCause?.description}`,
      `Detected change: ${primary ? JSON.stringify(primary) : "none"}`,
      `Downstream impact: ${impact?.summary?.totalAffected ?? 0} asset(s).`,
      "Write 2-3 sentences explaining why the proposed fix resolves the issue, then restate that this is a proposal that has not been executed.",
    ].join("\n");
    const text = await provider.generateText(prompt, { maxTokens: 200 });
    return text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {object} context
 * @param {object} context.rootCause - { type, confidence, description, column? }
 * @param {object[]} context.schemaChanges
 * @param {object} context.rootAsset
 * @param {object[]} [context.downstreamAssets]
 * @param {object} [context.impact]
 * @returns {Promise<{status: string, rootCause: string, fixType: string, summary: string, sql: string, tests: string[], files: object[], explanation: string, risk: string}>}
 */
export async function run({ rootCause, schemaChanges = [], rootAsset, downstreamAssets = [], impact }) {
  const primary = schemaChanges.find((c) => c.severity === "HIGH") ?? schemaChanges[0];
  const built = buildFix(primary, rootAsset);
  const explanation = await buildExplanation({ rootCause, primary, rootAsset, downstreamAssets, impact, deterministic: built });

  return {
    status: "PROPOSED",
    rootCause: rootCause?.description ?? "Root cause undetermined.",
    fixType: built.fixType,
    summary: built.summary,
    sql: built.sql,
    tests: built.tests,
    files: built.files,
    explanation,
    risk: built.risk,
  };
}
