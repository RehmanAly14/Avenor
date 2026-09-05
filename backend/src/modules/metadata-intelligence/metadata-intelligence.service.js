// src/modules/metadata-intelligence/metadata-intelligence.service.js
// ============================================================
// Avenor Metadata Intelligence Engine.
//
// PostgreSQL-backed replacement for the old DataHub integration.
// Owns lineage traversal, impact analysis, and metadata search —
// the internal context layer the AI agents (src/ai/) will read from.
//
// Lineage traversal uses recursive CTEs (not JS-side recursion) so
// a single query walks the whole graph — no N+1 — with a path-based
// cycle guard and a hard depth cap as a safety net.
// ============================================================

import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { containsInsensitive } from "../../utils/search.js";
import { paginationParams } from "../../utils/pagination.js";
import { transaction } from "../../utils/transaction.js";
import { compareSchemas } from "./schema-change.service.js";

const MAX_TRAVERSAL_DEPTH = 25;

const LIGHT_ASSET_SELECT = { id: true, name: true, description: true, assetType: true, qualifiedName: true, projectId: true, workspaceId: true };

const ASSET_INCLUDE = { dataSource: { select: { id: true, name: true, provider: true } }, domain: true, owners: true, tags: true, schemas: { include: { columns: { orderBy: { ordinal: "asc" } } }, orderBy: { updatedAt: "desc" } } };

async function scope(userId, projectId, workspaceId) {
  const [project, workspace] = await transaction([
    prisma.project.findFirst({ where: { id: projectId, ownerId: userId } }),
    prisma.workspace.findFirst({ where: { id: workspaceId, ownerId: userId } }),
  ]);
  if (!project || !workspace) throw new AppError("Project or workspace was not found or is not accessible.", HTTP_STATUS.FORBIDDEN);
}

export async function assetScope(id, userId) {
  const asset = await prisma.metadataAsset.findUnique({ where: { id }, include: ASSET_INCLUDE });
  if (!asset) throw new AppError("Metadata asset not found.", HTTP_STATUS.NOT_FOUND);
  await scope(userId, asset.projectId, asset.workspaceId);
  return asset;
}

// ── Lineage ─────────────────────────────────────────────────

export async function createLineage(userId, data) {
  const sourceAsset = await assetScope(data.sourceAssetId, userId);
  const targetAsset = await prisma.metadataAsset.findFirst({
    where: { id: data.targetAssetId, projectId: sourceAsset.projectId, workspaceId: sourceAsset.workspaceId },
  });
  if (!targetAsset) throw new AppError("Target asset was not found in the same project and workspace as the source asset.", HTTP_STATUS.UNPROCESSABLE_ENTITY);

  return prisma.metadataLineage.create({
    data: {
      projectId: sourceAsset.projectId,
      workspaceId: sourceAsset.workspaceId,
      sourceAssetId: data.sourceAssetId,
      targetAssetId: data.targetAssetId,
      relationshipType: data.relationshipType,
      confidence: data.confidence ?? 1.0,
      metadata: data.metadata ?? undefined,
    },
  });
}

async function traverseDownstream(assetId, maxDepth = MAX_TRAVERSAL_DEPTH) {
  return prisma.$queryRaw`
    WITH RECURSIVE downstream AS (
      SELECT target_asset_id AS asset_id, 1 AS depth, ARRAY[source_asset_id, target_asset_id] AS path
      FROM metadata_lineages
      WHERE source_asset_id = ${assetId}
      UNION ALL
      SELECT ml.target_asset_id, d.depth + 1, d.path || ml.target_asset_id
      FROM metadata_lineages ml
      INNER JOIN downstream d ON ml.source_asset_id = d.asset_id
      WHERE NOT (ml.target_asset_id = ANY(d.path)) AND d.depth < ${maxDepth}
    )
    SELECT asset_id AS "assetId", MIN(depth)::int AS depth FROM downstream GROUP BY asset_id ORDER BY depth ASC;
  `;
}

async function traverseUpstream(assetId, maxDepth = MAX_TRAVERSAL_DEPTH) {
  return prisma.$queryRaw`
    WITH RECURSIVE upstream AS (
      SELECT source_asset_id AS asset_id, 1 AS depth, ARRAY[target_asset_id, source_asset_id] AS path
      FROM metadata_lineages
      WHERE target_asset_id = ${assetId}
      UNION ALL
      SELECT ml.source_asset_id, u.depth + 1, u.path || ml.source_asset_id
      FROM metadata_lineages ml
      INNER JOIN upstream u ON ml.target_asset_id = u.asset_id
      WHERE NOT (ml.source_asset_id = ANY(u.path)) AND u.depth < ${maxDepth}
    )
    SELECT asset_id AS "assetId", MIN(depth)::int AS depth FROM upstream GROUP BY asset_id ORDER BY depth ASC;
  `;
}

async function hydrate(rows) {
  if (!rows.length) return [];
  const assets = await prisma.metadataAsset.findMany({ where: { id: { in: rows.map((r) => r.assetId) } }, select: LIGHT_ASSET_SELECT });
  const byId = new Map(assets.map((a) => [a.id, a]));
  return rows.map((r) => ({ ...byId.get(r.assetId), depth: r.depth })).filter((r) => r.id);
}

export async function getUpstream(assetId, userId) {
  const asset = await assetScope(assetId, userId);
  const upstream = await hydrate(await traverseUpstream(assetId));
  return { assetId, asset: pickLight(asset), upstream };
}

export async function getDownstream(assetId, userId) {
  const asset = await assetScope(assetId, userId);
  const downstream = await hydrate(await traverseDownstream(assetId));
  return { assetId, asset: pickLight(asset), downstream };
}

export async function getLineage(assetId, userId) {
  const asset = await assetScope(assetId, userId);
  const [upstream, downstream] = await Promise.all([hydrate(await traverseUpstream(assetId)), hydrate(await traverseDownstream(assetId))]);
  return { asset: pickLight(asset), upstream, downstream };
}

export async function getGraph(assetId, userId) {
  const asset = await assetScope(assetId, userId);
  const [upstreamRows, downstreamRows] = await Promise.all([traverseUpstream(assetId), traverseDownstream(assetId)]);

  const upstream = await hydrate(upstreamRows);
  const downstream = await hydrate(downstreamRows);

  const nodeMap = new Map();
  nodeMap.set(asset.id, { asset: pickLight(asset), depth: 0 });
  for (const item of upstream) nodeMap.set(item.id, { asset: item, depth: -item.depth });
  for (const item of downstream) nodeMap.set(item.id, { asset: item, depth: item.depth });

  const columnAt = new Map();
  const nodes = [...nodeMap.values()].map(({ asset: a, depth }) => {
    const row = columnAt.get(depth) ?? 0;
    columnAt.set(depth, row + 1);
    return {
      id: a.id,
      type: "default",
      position: { x: depth * 260, y: row * 120 },
      data: { label: a.name, assetType: a.assetType, qualifiedName: a.qualifiedName, depth },
    };
  });

  const allIds = [...nodeMap.keys()];
  const edgeRows = await prisma.metadataLineage.findMany({
    where: { sourceAssetId: { in: allIds }, targetAssetId: { in: allIds } },
    select: { id: true, sourceAssetId: true, targetAssetId: true, relationshipType: true, confidence: true },
  });
  const edges = edgeRows.map((e) => ({
    id: e.id,
    source: e.sourceAssetId,
    target: e.targetAssetId,
    label: e.relationshipType,
    data: { confidence: e.confidence },
  }));

  return { nodes, edges };
}

function pickLight(asset) {
  return { id: asset.id, name: asset.name, description: asset.description, assetType: asset.assetType, qualifiedName: asset.qualifiedName };
}

// ── Impact Analysis ────────────────────────────────────────

function categorize(assetType = "") {
  const type = assetType.toUpperCase();
  if (type.includes("DASHBOARD")) return "affectedDashboards";
  if (type.includes("MODEL")) return "affectedModels";
  if (type.includes("PIPELINE") || type.includes("JOB") || type.includes("ETL")) return "affectedPipelines";
  return null;
}

export async function getImpact(assetId, userId) {
  const asset = await assetScope(assetId, userId);
  const affectedAssets = await hydrate(await traverseDownstream(assetId));

  const buckets = { affectedDashboards: [], affectedModels: [], affectedPipelines: [] };
  for (const item of affectedAssets) {
    const bucket = categorize(item.assetType);
    if (bucket) buckets[bucket].push(item);
  }

  return {
    asset: pickLight(asset),
    affectedAssets,
    ...buckets,
    totalImpact: affectedAssets.length,
  };
}

// ── Metadata Search ────────────────────────────────────────
// PostgreSQL ILIKE across the metadata graph today; the public shape
// (q in, ranked items out) is deliberately stable so a future switch to
// full-text / pgvector search only touches this function's internals.

function scoreMatch(asset, q) {
  const needle = q.toLowerCase();
  let score = 0;
  const name = asset.name?.toLowerCase() ?? "";
  if (name === needle) score += 100;
  else if (name.startsWith(needle)) score += 80;
  else if (name.includes(needle)) score += 60;
  if (asset.qualifiedName?.toLowerCase().includes(needle)) score += 50;
  if (asset.description?.toLowerCase().includes(needle)) score += 30;
  if (asset.domain?.name?.toLowerCase().includes(needle)) score += 20;
  if (asset.tags?.some((t) => t.name.toLowerCase().includes(needle))) score += 20;
  if (asset.owners?.some((o) => o.name.toLowerCase().includes(needle) || o.email?.toLowerCase().includes(needle))) score += 20;
  if (asset.schemas?.some((s) => s.columns.some((c) => c.name.toLowerCase().includes(needle) || c.description?.toLowerCase().includes(needle)))) score += 15;
  return score;
}

export async function search(userId, filters) {
  const { q, projectId, workspaceId, page, limit } = filters;
  if (projectId || workspaceId) {
    if (!projectId || !workspaceId) throw new AppError("projectId and workspaceId must be supplied together.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    await scope(userId, projectId, workspaceId);
  }

  const where = {
    ...(projectId ? { projectId, workspaceId } : { project: { ownerId: userId } }),
    OR: [
      { name: containsInsensitive(q) },
      { description: containsInsensitive(q) },
      { qualifiedName: containsInsensitive(q) },
      { owners: { some: { OR: [{ name: containsInsensitive(q) }, { email: containsInsensitive(q) }] } } },
      { tags: { some: { name: containsInsensitive(q) } } },
      { domain: { name: containsInsensitive(q) } },
      { schemas: { some: { columns: { some: { OR: [{ name: containsInsensitive(q) }, { description: containsInsensitive(q) }] } } } } },
    ],
  };

  const candidates = await prisma.metadataAsset.findMany({ where, include: ASSET_INCLUDE, take: 200 });
  const ranked = candidates.map((asset) => ({ asset, score: scoreMatch(asset, q) })).sort((a, b) => b.score - a.score);

  const pg = paginationParams({ page, limit });
  const items = ranked.slice(pg.skip, pg.skip + pg.take).map((r) => r.asset);
  return { items, total: ranked.length, pagination: pg };
}

// ── Schema Comparison ──────────────────────────────────────

async function loadColumns(schemaId, userId) {
  const schema = await prisma.metadataSchema.findUnique({ where: { id: schemaId }, include: { columns: true, asset: true } });
  if (!schema) throw new AppError("Metadata schema not found.", HTTP_STATUS.NOT_FOUND);
  await scope(userId, schema.asset.projectId, schema.asset.workspaceId);
  return schema.columns.map((c) => ({ name: c.name, dataType: c.dataType, isNullable: c.isNullable }));
}

export async function compareSchema(userId, data) {
  const oldColumns = data.oldSchemaId ? await loadColumns(data.oldSchemaId, userId) : data.oldColumns;
  const newColumns = data.newSchemaId ? await loadColumns(data.newSchemaId, userId) : data.newColumns;
  return compareSchemas(oldColumns, newColumns);
}

// ── Owners (used by the AI tool layer) ─────────────────────

export async function getOwner(id, userId) {
  const owner = await prisma.metadataOwner.findFirst({ where: { id, workspace: { ownerId: userId } }, include: { assets: { select: LIGHT_ASSET_SELECT } } });
  if (!owner) throw new AppError("Metadata owner not found.", HTTP_STATUS.NOT_FOUND);
  return owner;
}
