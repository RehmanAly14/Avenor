// src/modules/investigation/investigation.service.js
// ============================================================
// Deterministic metadata investigation engine.
//
// Investigations are stored as DataIncident rows — an investigation
// IS an incident being worked; `analyze` fills in rootCause and
// affectedAssets from the metadata graph. No LLM calls here: this
// is the tool the future Investigation Agent (src/ai/agents/investigator)
// will call into, not a replacement for it.
// ============================================================

import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { paginationParams } from "../../utils/pagination.js";
import { transaction } from "../../utils/transaction.js";
import * as intelligence from "../metadata-intelligence/metadata-intelligence.service.js";
import { compareSchemas } from "../metadata-intelligence/schema-change.service.js";

async function scope(userId, projectId, workspaceId) {
  const [project, workspace] = await transaction([
    prisma.project.findFirst({ where: { id: projectId, ownerId: userId } }),
    prisma.workspace.findFirst({ where: { id: workspaceId, ownerId: userId } }),
  ]);
  if (!project || !workspace) throw new AppError("Project or workspace was not found or is not accessible.", HTTP_STATUS.FORBIDDEN);
}

async function investigationScope(id, userId) {
  const incident = await prisma.dataIncident.findUnique({ where: { id } });
  if (!incident) throw new AppError("Investigation not found.", HTTP_STATUS.NOT_FOUND);
  await scope(userId, incident.projectId, incident.workspaceId);
  return incident;
}

export async function createInvestigation(userId, data) {
  await scope(userId, data.projectId, data.workspaceId);
  return prisma.dataIncident.create({
    data: { projectId: data.projectId, workspaceId: data.workspaceId, title: data.title, description: data.description, severity: data.severity ?? "MEDIUM" },
  });
}

export async function listInvestigations(userId, filters) {
  const { page, limit, projectId, workspaceId, status } = filters;
  if (projectId || workspaceId) {
    if (!projectId || !workspaceId) throw new AppError("projectId and workspaceId must be supplied together.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    await scope(userId, projectId, workspaceId);
  }
  const where = { ...(projectId ? { projectId, workspaceId } : { project: { ownerId: userId } }), ...(status && { status }) };
  const pg = paginationParams({ page, limit });
  const [items, total] = await transaction([
    prisma.dataIncident.findMany({ where, orderBy: { updatedAt: "desc" }, skip: pg.skip, take: pg.take }),
    prisma.dataIncident.count({ where }),
  ]);
  return { items, total, pagination: pg };
}

export async function getInvestigation(id, userId) {
  return investigationScope(id, userId);
}

export async function detectSchemaChanges(assetId) {
  const schemas = await prisma.metadataSchema.findMany({ where: { assetId }, include: { columns: true }, orderBy: { updatedAt: "desc" }, take: 2 });
  if (schemas.length < 2) return { changes: [], note: "No prior schema snapshot is available for comparison." };
  const [latest, previous] = schemas;
  const toSnapshot = (s) => s.columns.map((c) => ({ name: c.name, dataType: c.dataType, isNullable: c.isNullable }));
  return { ...compareSchemas(toSnapshot(previous), toSnapshot(latest)), note: undefined };
}

function buildRootCauseCandidates({ schemaChanges, upstream }) {
  const candidates = schemaChanges
    .filter((c) => c.severity === "HIGH")
    .map((c) => ({ type: c.type, column: c.column, description: `${c.type.replace(/_/g, " ").toLowerCase()} on column "${c.column}" may be the root cause.`, confidence: 0.7 }));

  if (!upstream.length) {
    candidates.push({ type: "NO_UPSTREAM", description: "This asset has no known upstream sources — it may be a raw ingestion point; investigate the source system directly.", confidence: 0.4 });
  } else if (!candidates.length) {
    const nearest = upstream.filter((u) => u.depth === 1).map((u) => u.name);
    candidates.push({ type: "REVIEW_UPSTREAM", description: `No schema changes detected. Review the nearest upstream asset(s): ${nearest.join(", ") || upstream[0]?.name}.`, confidence: 0.3 });
  }
  return candidates;
}

function buildRecommendations({ schemaChanges, impact, owners }) {
  const recs = [];
  if (schemaChanges.some((c) => c.severity === "HIGH")) recs.push("Review the recent high-severity schema change before making further changes downstream.");
  if (impact.totalImpact > 0) recs.push(`Notify owners of ${impact.totalImpact} downstream asset(s) before resolving this incident.`);
  if (owners.length) recs.push(`Reach out to: ${owners.map((o) => o.name).join(", ")}.`);
  if (impact.affectedDashboards.length) recs.push(`Verify dashboards once resolved: ${impact.affectedDashboards.map((a) => a.name).join(", ")}.`);
  if (!recs.length) recs.push("No immediate action identified from the metadata graph — continue monitoring the asset.");
  return recs;
}

export async function analyze(id, userId, { assetId, problem }) {
  const incident = await investigationScope(id, userId);
  const rootAsset = await intelligence.assetScope(assetId, userId);
  if (rootAsset.projectId !== incident.projectId || rootAsset.workspaceId !== incident.workspaceId) {
    throw new AppError("Asset does not belong to this investigation's project and workspace.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  const [{ upstream }, { downstream }, schemaChanges, impact] = await Promise.all([
    intelligence.getUpstream(assetId, userId),
    intelligence.getDownstream(assetId, userId),
    detectSchemaChanges(assetId),
    intelligence.getImpact(assetId, userId),
  ]);

  const rootCauseCandidates = buildRootCauseCandidates({ schemaChanges: schemaChanges.changes, upstream });
  const recommendations = buildRecommendations({ schemaChanges: schemaChanges.changes, impact, owners: rootAsset.owners });

  const updated = await prisma.dataIncident.update({
    where: { id },
    data: {
      status: "INVESTIGATING",
      rootCause: rootCauseCandidates[0]?.description ?? null,
      affectedAssets: impact.affectedAssets.map((a) => ({ id: a.id, name: a.name, depth: a.depth })),
    },
  });

  return {
    incident: updated,
    rootAsset: { id: rootAsset.id, name: rootAsset.name, description: rootAsset.description, assetType: rootAsset.assetType, qualifiedName: rootAsset.qualifiedName },
    problem,
    rootCauseCandidates,
    schemaChanges: schemaChanges.changes,
    upstreamAssets: upstream,
    downstreamAssets: downstream,
    affectedAssets: impact.affectedAssets,
    owners: rootAsset.owners,
    recommendations,
  };
}
