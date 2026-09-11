// src/integrations/postgres/postgres.lineage.js
// ============================================================
// Level 1 (reliable) PostgreSQL-native lineage discovery.
//
// This module answers one narrow question: "what dependency
// relationships can PostgreSQL's own system catalogs prove exist,
// with no guessing?" It deliberately does NOT attempt to infer
// analytical/transformation lineage (e.g. "orders feeds the revenue
// model") — that requires understanding *why* a view was written the
// way it was, which is what future lineage providers (dbt manifest,
// SQL parsing, query-history mining, AI inference) are for. See
// src/integrations/postgres/README.md for the full provider model.
//
// Two independent, catalog-backed signals are combined here:
//
//   1. Foreign keys       — pg_constraint / pg_attribute (via unnest
//                            with ordinality, not information_schema's
//                            constraint_column_usage, which is
//                            documented to misorder columns on
//                            composite/multi-column foreign keys).
//   2. View dependencies  — pg_depend / pg_rewrite: every ordinary
//                            view AND materialized view carries a
//                            pg_rewrite "ON SELECT" rule, and pg_depend
//                            records that rule's dependency on each
//                            relation the view reads from. Verified
//                            empirically (not assumed) against a real
//                            Postgres instance with both a plain view
//                            and a materialized view stacked on it —
//                            both surface identically through this
//                            query (view_relkind 'v' and 'm' alike).
//
// Direction convention (must match src/modules/metadata-intelligence):
// the existing MetadataLineage model and its recursive traversal CTEs
// (traverseUpstream/traverseDownstream) treat sourceAssetId as the
// UPSTREAM/cause side and targetAssetId as the DOWNSTREAM/effect side,
// regardless of relationshipType's label — confirmed from
// getUpstream/getDownstream/getImpact and from existing lineage rows
// in tests (e.g. sourceAssetId: orders, targetAssetId: revenueModel,
// relationshipType: "READS_FROM"). This module follows that exact
// convention:
//   - Foreign key: source = the REFERENCED table (e.g. customers —
//     changing it can affect anything that joins to it), target = the
//     table HOLDING the FK (e.g. orders). relationshipType READS_FROM.
//   - View/matview dependency: source = the base relation being read,
//     target = the view/matview built on top of it. relationshipType
//     DERIVED_FROM.
// ============================================================

import pg from "pg";

const { Client } = pg;

const CONNECT_TIMEOUT_MS = 8000;
const QUERY_TIMEOUT_MS = 15000;

function sanitizeError(err, config) {
  let message = err?.message || "Unknown connection error";
  if (config?.password) message = message.split(config.password).join("***");
  return message;
}

async function withClient(config, fn) {
  const base = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
  };

  const attempt = async (ssl) => {
    const client = new Client({ ...base, ssl });
    await client.connect();
    try {
      return await fn(client);
    } finally {
      await client.end().catch(() => {});
    }
  };

  try {
    return await attempt(undefined);
  } catch (err) {
    const msg = (err?.message || "").toLowerCase();
    const looksLikeSsl = msg.includes("ssl") || msg.includes("self signed") || msg.includes("certificate");
    if (!looksLikeSsl) throw err;
    return attempt({ rejectUnauthorized: false });
  }
}

const RELKIND_TO_ASSET_TYPE = { r: "TABLE", p: "TABLE", v: "VIEW", m: "MATERIALIZED_VIEW", f: "FOREIGN_TABLE" };

// Optional schema allowlist, same convention as postgres.introspect.js's
// schemaScope: unset scans every non-system schema (the default, and the
// prior unconditional behavior); set, restricts to exactly those schemas
// on *both* sides of a relationship — a foreign key or view dependency
// that crosses into an out-of-scope schema is left undiscovered rather
// than partially reported.
function schemaScope(column, schemas, paramIndex) {
  if (schemas?.length) return `${column} = ANY($${paramIndex}::text[])`;
  return `${column} NOT IN ('pg_catalog', 'information_schema')`;
}

// Composite-foreign-key-safe: joins pg_constraint's conkey/confkey column
// arrays positionally via unnest(...) WITH ORDINALITY, rather than
// information_schema.constraint_column_usage, whose own documentation
// notes it does not reliably preserve column order for multi-column keys.
function foreignKeyQuery(schemas) {
  const params = schemas?.length ? [schemas] : [];
  return {
    text: `
      SELECT
        con.conname AS constraint_name,
        ns.nspname AS child_schema, cl.relname AS child_table,
        array_agg(att.attname::text ORDER BY u.ord) AS child_columns,
        fns.nspname AS parent_schema, fcl.relname AS parent_table,
        array_agg(fatt.attname::text ORDER BY u.ord) AS parent_columns
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_class fcl ON fcl.oid = con.confrelid
      JOIN pg_namespace fns ON fns.oid = fcl.relnamespace
      JOIN LATERAL unnest(con.conkey, con.confkey) WITH ORDINALITY AS u(attnum, confattnum, ord) ON true
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = u.attnum
      JOIN pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = u.confattnum
      WHERE con.contype = 'f'
        AND ${schemaScope("ns.nspname", schemas, 1)}
        AND ${schemaScope("fns.nspname", schemas, 1)}
      GROUP BY con.conname, ns.nspname, cl.relname, fns.nspname, fcl.relname
      ORDER BY ns.nspname, cl.relname, con.conname
    `,
    params,
  };
}

// Every view/matview's ON-SELECT rewrite rule (pg_rewrite) depends
// (pg_depend, deptype 'n' = normal) on each relation its defining query
// reads. classid restricts this to rewrite-rule dependencies specifically
// (pg_depend also carries unrelated dependency kinds with deptype 'n').
function viewDependencyQuery(schemas) {
  const params = schemas?.length ? [schemas] : [];
  return {
    text: `
      SELECT DISTINCT
        dependent_ns.nspname AS view_schema, dependent_view.relname AS view_name, dependent_view.relkind AS view_relkind,
        source_ns.nspname AS source_schema, source_rel.relname AS source_name, source_rel.relkind AS source_relkind
      FROM pg_depend
      JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
      JOIN pg_class dependent_view ON pg_rewrite.ev_class = dependent_view.oid
      JOIN pg_class source_rel ON pg_depend.refobjid = source_rel.oid
      JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
      JOIN pg_namespace source_ns ON source_ns.oid = source_rel.relnamespace
      WHERE pg_depend.deptype = 'n'
        AND pg_depend.classid = 'pg_rewrite'::regclass
        AND dependent_view.relkind IN ('v', 'm')
        AND source_rel.relkind IN ('r', 'v', 'm', 'p', 'f')
        AND dependent_view.oid <> source_rel.oid
        AND ${schemaScope("dependent_ns.nspname", schemas, 1)}
        AND ${schemaScope("source_ns.nspname", schemas, 1)}
      ORDER BY view_schema, view_name, source_schema, source_name
    `,
    params,
  };
}

/**
 * Discovers Level 1 lineage: foreign keys and view/materialized-view
 * dependencies, read live from PostgreSQL's system catalogs. Read-only —
 * every query here is a SELECT against pg_catalog/information_schema.
 *
 * @param {object} [options]
 * @param {string[]} [options.schemas] - restrict discovery to relationships
 *   where both endpoints are in exactly these schemas. Omit to discover
 *   every non-system schema, the default.
 * @returns {Promise<Array<{
 *   source: {schema: string, name: string, type: string},
 *   target: {schema: string, name: string, type: string},
 *   relationshipType: "READS_FROM" | "DERIVED_FROM",
 *   discoveryMethod: "FOREIGN_KEY" | "VIEW_DEPENDENCY",
 *   confidence: number,
 *   metadata: object
 * }>>}
 */
export async function introspectLineage(config, options = {}) {
  const { schemas } = options;
  try {
    return await withClient(config, async (client) => {
      const fk = foreignKeyQuery(schemas);
      const view = viewDependencyQuery(schemas);
      const [fkResult, viewResult] = await Promise.all([client.query(fk.text, fk.params), client.query(view.text, view.params)]);

      const foreignKeys = fkResult.rows.map((row) => ({
        source: { schema: row.parent_schema, name: row.parent_table, type: "TABLE" },
        target: { schema: row.child_schema, name: row.child_table, type: "TABLE" },
        relationshipType: "READS_FROM",
        discoveryMethod: "FOREIGN_KEY",
        confidence: 1.0,
        metadata: { constraintName: row.constraint_name, sourceColumns: row.parent_columns, targetColumns: row.child_columns },
      }));

      const viewDependencies = viewResult.rows.map((row) => ({
        source: { schema: row.source_schema, name: row.source_name, type: RELKIND_TO_ASSET_TYPE[row.source_relkind] ?? "TABLE" },
        target: { schema: row.view_schema, name: row.view_name, type: RELKIND_TO_ASSET_TYPE[row.view_relkind] ?? "VIEW" },
        relationshipType: "DERIVED_FROM",
        discoveryMethod: "VIEW_DEPENDENCY",
        confidence: 1.0,
        metadata: {},
      }));

      return [...foreignKeys, ...viewDependencies];
    });
  } catch (err) {
    throw new Error(sanitizeError(err, config));
  }
}
