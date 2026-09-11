import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { encrypt, decrypt } from "../../utils/encryption.js";
import { paginationParams } from "../../utils/pagination.js";
import { transaction } from "../../utils/transaction.js";
import { testConnection, introspectSchema, introspectLineage } from "../../integrations/postgres/postgres.introspect.js";

const SELECT = { id: true, projectId: true, workspaceId: true, name: true, provider: true, host: true, port: true, database: true, username: true, status: true, lastSyncedAt: true, lastError: true, createdAt: true, updatedAt: true };

async function assertScope(userId, projectId, workspaceId) {
  const [project, workspace] = await transaction([prisma.project.findFirst({ where: { id: projectId, ownerId: userId } }), prisma.workspace.findFirst({ where: { id: workspaceId, ownerId: userId } })]);
  if (!project || !workspace) throw new AppError("Project or workspace was not found or is not accessible.", HTTP_STATUS.FORBIDDEN);
}
async function owned(id, userId) {
  const source = await prisma.dataSource.findUnique({ where: { id } });
  if (!source) throw new AppError("Data source not found.", HTTP_STATUS.NOT_FOUND);
  await assertScope(userId, source.projectId, source.workspaceId); return source;
}

/** Live-tests a connection for providers we can actually introspect. MySQL is accepted by the schema but not implemented yet — fail loudly rather than pretending it was verified. */
async function verifyConnectable(provider, config) {
  if (provider !== "POSTGRESQL") throw new AppError("Live connections are only supported for PostgreSQL right now. MySQL data sources cannot be verified or synced yet.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  try {
    await testConnection(config);
  } catch (err) {
    throw new AppError(`Could not connect to the database: ${err.message}`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
}

export async function createDataSource(userId, data) {
  await assertScope(userId, data.projectId, data.workspaceId);
  const { password, ...rest } = data;
  await verifyConnectable(data.provider, { host: data.host, port: data.port, database: data.database, username: data.username, password });
  return prisma.dataSource.create({ data: { ...rest, encryptedPassword: encrypt(password), status: "ACTIVE", lastError: null }, select: SELECT });
}

export async function listDataSources(userId, filters) {
  const { page, limit, projectId, workspaceId } = filters;
  if (projectId || workspaceId) { if (!projectId || !workspaceId) throw new AppError("projectId and workspaceId must be supplied together.", HTTP_STATUS.UNPROCESSABLE_ENTITY); await assertScope(userId, projectId, workspaceId); }
  const where = { ...(projectId ? { projectId } : { project: { ownerId: userId } }), ...(workspaceId && { workspaceId }) };
  const pg = paginationParams({ page, limit });
  const [items, total] = await transaction([prisma.dataSource.findMany({ where, select: SELECT, orderBy: { createdAt: "desc" }, skip: pg.skip, take: pg.take }), prisma.dataSource.count({ where })]);
  return { items, total, pagination: pg };
}

export async function getDataSource(id, userId) { await owned(id, userId); return prisma.dataSource.findUnique({ where: { id }, select: SELECT }); }

export async function updateDataSource(id, userId, data) {
  const existing = await owned(id, userId);
  const { password, ...rest } = data;
  const touchesConnection = ["host", "port", "database", "username"].some((key) => key in data) || password;
  if (touchesConnection) {
    const merged = { host: data.host ?? existing.host, port: data.port ?? existing.port, database: data.database ?? existing.database, username: data.username ?? existing.username, password: password ?? decrypt(existing.encryptedPassword) };
    await verifyConnectable(existing.provider, merged);
  }
  return prisma.dataSource.update({ where: { id }, data: { ...rest, ...(password && { encryptedPassword: encrypt(password) }), ...(touchesConnection && { status: "ACTIVE", lastError: null }) }, select: SELECT });
}

export async function deleteDataSource(id, userId) { await owned(id, userId); await prisma.dataSource.delete({ where: { id } }); }

function columnSignature(columns) {
  return [...columns].map((c) => `${c.name}:${c.dataType}:${c.isNullable}`).sort().join("|");
}

// A schema's default ("public") stays exactly as it always displayed
// (bare table name) so nothing existing changes; every other schema is
// prefixed to avoid e.g. public.orders and analytics.orders colliding
// in the UI. qualifiedName (below) is what's actually unique, this is
// just the human-facing label.
function displayName(schema, tableName) {
  return schema === "public" ? tableName : `${schema}.${tableName}`;
}

const RELATION_KIND_TO_ASSET_TYPE = { TABLE: "TABLE", VIEW: "VIEW", MATERIALIZED_VIEW: "MATERIALIZED_VIEW" };

/**
 * Connects to the real database, reads its live schema, and reconciles
 * that into the metadata catalog: one MetadataAsset per table/view/
 * materialized view, and a new MetadataSchema snapshot whenever a
 * relation's columns actually changed since the last sync (so
 * schema-change detection has real history to compare, not hand-seeded
 * fixtures). Then reads Level 1 PostgreSQL-native lineage (foreign keys,
 * view/matview dependencies — see src/integrations/postgres/postgres.lineage.js
 * for exactly what is and isn't discovered) and reconciles it into
 * MetadataLineage the same way: create/update what's newly true, remove
 * only what this same mechanism previously created and is no longer true.
 *
 * Schema sync and lineage sync fail independently (Option B): a database
 * that answers information_schema queries but denies pg_catalog access
 * (unusual, but possible under a restrictive role) still gets its tables
 * and columns synced — lineageError is reported rather than the whole
 * sync being rolled back over a partial capability gap.
 *
 * `schemas` (optional, not yet exposed on the public API/DataSource model)
 * narrows discovery to specific schema names — see introspectSchema's
 * jsdoc. Exists as a ready extension point for a future per-datasource
 * schema allowlist setting; today it's used only by the test suite, to
 * scope a sync to a disposable test schema instead of an entire shared
 * database.
 *
 * `introspect` (optional) swaps in alternate introspectSchema/
 * introspectLineage implementations — the real ones are the default for
 * every real caller. This exists purely so the test suite can exercise
 * reconciliation edge cases (a discovered relationship whose target
 * wasn't synced as an asset; a lineage-introspection-only failure) that
 * are impractical to reproduce with real database permissions/extensions,
 * without reaching for experimental Node module-mocking flags.
 */
export async function syncDataSource(id, userId, { schemas, introspect = {} } = {}) {
  const doIntrospectSchema = introspect.introspectSchema ?? introspectSchema;
  const doIntrospectLineage = introspect.introspectLineage ?? introspectLineage;

  const dataSource = await owned(id, userId);
  if (dataSource.provider !== "POSTGRESQL") throw new AppError("Live sync is only supported for PostgreSQL right now.", HTTP_STATUS.UNPROCESSABLE_ENTITY);

  const config = { host: dataSource.host, port: dataSource.port, database: dataSource.database, username: dataSource.username, password: decrypt(dataSource.encryptedPassword) };

  let tables;
  try {
    tables = await doIntrospectSchema(config, { schemas });
  } catch (err) {
    await prisma.dataSource.update({ where: { id }, data: { status: "ERROR", lastError: err.message } });
    throw new AppError(`Could not sync data source: ${err.message}`, HTTP_STATUS.BAD_GATEWAY);
  }

  const summary = { tablesScanned: tables.length, assetsCreated: 0, assetsUpdated: 0, schemaChangesDetected: 0, lineageDiscovered: 0, lineageCreated: 0, lineageRemoved: 0, lineageError: null };
  const assetIdByRelation = new Map(); // "schema.table" -> MetadataAsset.id, scoped to this datasource's own tables/views/matviews only (Task 9 isolation)

  for (const table of tables) {
    const qualifiedName = `${dataSource.id}:${table.schema}.${table.tableName}`;
    const assetType = RELATION_KIND_TO_ASSET_TYPE[table.relationKind] ?? "TABLE";
    const existingAsset = await prisma.metadataAsset.findUnique({ where: { qualifiedName } });

    const asset = await prisma.metadataAsset.upsert({
      where: { qualifiedName },
      update: { name: displayName(table.schema, table.tableName), assetType },
      create: { projectId: dataSource.projectId, workspaceId: dataSource.workspaceId, dataSourceId: dataSource.id, name: displayName(table.schema, table.tableName), qualifiedName, assetType },
    });
    if (existingAsset) summary.assetsUpdated += 1; else summary.assetsCreated += 1;
    assetIdByRelation.set(`${table.schema}.${table.tableName}`, asset.id);

    const latestSchema = await prisma.metadataSchema.findFirst({ where: { assetId: asset.id }, orderBy: { createdAt: "desc" }, include: { columns: true } });
    const changed = !latestSchema || columnSignature(latestSchema.columns) !== columnSignature(table.columns);
    if (changed) {
      if (latestSchema) summary.schemaChangesDetected += 1;
      await prisma.metadataSchema.create({
        data: {
          assetId: asset.id,
          name: `sync_${new Date().toISOString()}`,
          columns: { create: table.columns.map((c) => ({ name: c.name, dataType: c.dataType, isNullable: c.isNullable, ordinal: c.ordinal })) },
        },
      });
    }
  }

  let lineageRecords = null;
  try {
    lineageRecords = await doIntrospectLineage(config, { schemas });
  } catch (err) {
    summary.lineageError = err.message;
  }

  if (lineageRecords) {
    summary.lineageDiscovered = lineageRecords.length;
    const currentLineageIds = new Set();

    for (const record of lineageRecords) {
      const sourceAssetId = assetIdByRelation.get(`${record.source.schema}.${record.source.name}`);
      const targetAssetId = assetIdByRelation.get(`${record.target.schema}.${record.target.name}`);
      // Task 6: only persist an edge once both endpoints exist as MetadataAssets
      // from this same sync — e.g. a relation excluded from schema discovery for
      // any reason never produces a dangling lineage edge.
      if (!sourceAssetId || !targetAssetId) continue;

      const metadata = { provider: "POSTGRESQL", discoveryMethod: record.discoveryMethod, ...record.metadata };
      const lineage = await prisma.metadataLineage.upsert({
        where: { sourceAssetId_targetAssetId_relationshipType: { sourceAssetId, targetAssetId, relationshipType: record.relationshipType } },
        update: { confidence: record.confidence, metadata },
        create: { projectId: dataSource.projectId, workspaceId: dataSource.workspaceId, sourceAssetId, targetAssetId, relationshipType: record.relationshipType, confidence: record.confidence, metadata },
      });
      currentLineageIds.add(lineage.id);
    }
    summary.lineageCreated = currentLineageIds.size;

    // Stale removal (Task 8): only edges (a) between two assets that belong
    // to THIS datasource's own tables (Task 9 isolation — assetIdByRelation
    // only ever holds this sync's own relations) and (b) previously tagged
    // as generated by this exact PostgreSQL mechanism, and (c) no longer
    // reported by the latest introspection. Manually-created lineage and
    // lineage from any future provider carries no such tag and is never
    // touched.
    const ownAssetIds = [...assetIdByRelation.values()];
    const priorPostgresLineage = await prisma.metadataLineage.findMany({
      where: { projectId: dataSource.projectId, workspaceId: dataSource.workspaceId, sourceAssetId: { in: ownAssetIds }, targetAssetId: { in: ownAssetIds } },
      select: { id: true, metadata: true },
    });
    const stale = priorPostgresLineage.filter((l) => l.metadata?.provider === "POSTGRESQL" && !currentLineageIds.has(l.id));
    if (stale.length) {
      await prisma.metadataLineage.deleteMany({ where: { id: { in: stale.map((l) => l.id) } } });
      summary.lineageRemoved = stale.length;
    }
  }

  await prisma.dataSource.update({ where: { id }, data: { status: "ACTIVE", lastSyncedAt: new Date(), lastError: null } });
  return summary;
}
