// src/integrations/postgres/postgres.introspect.js
// ============================================================
// Real, live introspection of a user's PostgreSQL database via
// information_schema — no ORM, no assumptions about table names.
// Used by the DataSource sync flow so the metadata catalog reflects
// an actual connected database instead of hand-entered rows.
//
// Public integration API (re-exported here so callers only ever
// import from this one file):
//   testConnection(config)    — cheap connectivity check
//   introspectSchema(config)  — tables + columns, all non-system schemas
//   introspectLineage(config) — foreign keys + view/matview dependencies
//                                (implementation: postgres.lineage.js —
//                                kept separate so schema and lineage
//                                discovery stay independently readable)
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

/**
 * Connects, runs `fn(client)`, and always closes the connection.
 * Retries once with `ssl: { rejectUnauthorized: false }` if the first
 * attempt fails for an SSL-shaped reason — most hosted Postgres
 * providers (Supabase, RDS, etc.) require SSL but don't hand out a
 * verifiable CA, so a hard requireSSL default would reject them too.
 */
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

/** Throws a clean, password-scrubbed error if the database is unreachable. */
export async function testConnection(config) {
  try {
    await withClient(config, (client) => client.query("SELECT 1"));
  } catch (err) {
    throw new Error(sanitizeError(err, config));
  }
}

// Every query below excludes pg_catalog/information_schema by default. The
// optional `schemas` allowlist (see introspectSchema's jsdoc) narrows that
// further — used by callers connecting to a shared database who only want
// their own application's schema(s) cataloged, not e.g. a hosting
// platform's internal auth/storage schemas alongside it. Unset, behavior
// is unchanged from before this option existed.
function schemaScope(column, schemas) {
  if (schemas?.length) return { clause: `${column} = ANY($1::text[])`, params: [schemas] };
  return { clause: `${column} NOT IN ('pg_catalog', 'information_schema')`, params: [] };
}

// information_schema covers ordinary tables and views identically and
// with stable, standard-conformant type names (e.g. "character varying"),
// which existing synced assets' column history already relies on — kept
// exactly as before so re-syncing a table never manufactures a fake
// TYPE_CHANGED just because the string format of its data type shifted.
function tablesQuery(schemas) {
  const { clause, params } = schemaScope("table_schema", schemas);
  return { text: `SELECT table_schema, table_name, table_type FROM information_schema.tables WHERE ${clause} AND table_type IN ('BASE TABLE', 'VIEW') ORDER BY table_schema, table_name`, params };
}

function columnsQuery(schemas) {
  const { clause, params } = schemaScope("table_schema", schemas);
  return { text: `SELECT table_schema, table_name, column_name, data_type, is_nullable, ordinal_position FROM information_schema.columns WHERE ${clause} ORDER BY table_schema, table_name, ordinal_position`, params };
}

// Materialized views are PostgreSQL-specific and, verified empirically,
// are NOT listed by information_schema.tables/.columns at all — pg_catalog
// is the only reliable source for them. format_type()'s wording can differ
// slightly from information_schema's (e.g. "character varying(255)" vs
// "character varying"), but that's irrelevant here: a materialized view
// has no prior information_schema-sourced column history to diverge from.
function materializedViewColumnsQuery(schemas) {
  const { clause, params } = schemaScope("n.nspname", schemas);
  return {
    text: `
      SELECT n.nspname AS table_schema, c.relname AS table_name, a.attname AS column_name,
        format_type(a.atttypid, a.atttypmod) AS data_type, NOT a.attnotnull AS is_nullable, a.attnum AS ordinal_position
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'm' AND ${clause} AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY n.nspname, c.relname, a.attnum
    `,
    params,
  };
}

const TABLE_TYPE_TO_RELATION_KIND = { "BASE TABLE": "TABLE", VIEW: "VIEW" };

/**
 * @param {object} config
 * @param {object} [options]
 * @param {string[]} [options.schemas] - restrict discovery to exactly these
 *   schema names (always still excluding pg_catalog/information_schema).
 *   Omit to discover every non-system schema, the default.
 * @returns {Promise<Array<{schema: string, tableName: string, relationKind: "TABLE"|"VIEW"|"MATERIALIZED_VIEW", columns: Array<{name: string, dataType: string, isNullable: boolean, ordinal: number}>}>>}
 */
export async function introspectSchema(config, options = {}) {
  const { schemas } = options;
  try {
    return await withClient(config, async (client) => {
      const tables = tablesQuery(schemas);
      const columns = columnsQuery(schemas);
      const matviewColumns = materializedViewColumnsQuery(schemas);
      const [tablesResult, columnsResult, matviewColumnsResult] = await Promise.all([
        client.query(tables.text, tables.params),
        client.query(columns.text, columns.params),
        client.query(matviewColumns.text, matviewColumns.params),
      ]);

      const byTable = new Map(
        tablesResult.rows.map((row) => [
          `${row.table_schema}.${row.table_name}`,
          {
            schema: row.table_schema,
            tableName: row.table_name,
            relationKind: TABLE_TYPE_TO_RELATION_KIND[row.table_type] ?? "TABLE",
            columns: [],
          },
        ])
      );

      for (const row of columnsResult.rows) {
        const table = byTable.get(`${row.table_schema}.${row.table_name}`);
        if (!table) continue;
        table.columns.push({ name: row.column_name, dataType: row.data_type, isNullable: row.is_nullable === "YES", ordinal: row.ordinal_position - 1 });
      }

      for (const row of matviewColumnsResult.rows) {
        const key = `${row.table_schema}.${row.table_name}`;
        if (!byTable.has(key)) byTable.set(key, { schema: row.table_schema, tableName: row.table_name, relationKind: "MATERIALIZED_VIEW", columns: [] });
        byTable.get(key).columns.push({ name: row.column_name, dataType: row.data_type, isNullable: row.is_nullable, ordinal: row.ordinal_position - 1 });
      }

      return [...byTable.values()];
    });
  } catch (err) {
    throw new Error(sanitizeError(err, config));
  }
}
export { introspectLineage } from "./postgres.lineage.js";
