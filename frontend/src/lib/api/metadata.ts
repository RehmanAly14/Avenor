import { apiClient } from "./client";
import type { ImpactAnalysis, LineageGraph, MetadataAsset, MetadataDomain, MetadataOwner, MetadataSchema, MetadataTag, SchemaChange } from "./types";

export interface CreateAssetInput {
  projectId: string;
  workspaceId: string;
  dataSourceId?: string | null;
  name: string;
  description?: string | null;
  qualifiedName?: string | null;
  assetType?: string;
  domainId?: string | null;
  ownerIds?: string[];
  tagIds?: string[];
  schemas?: MetadataSchema[];
}

export async function listAssets(params?: { projectId?: string; workspaceId?: string; q?: string; page?: number; limit?: number }) {
  const { data, meta } = await apiClient.getPaged<{ assets: MetadataAsset[] }>("/metadata/assets", params);
  return { assets: data.assets, meta };
}

export async function getAsset(id: string) {
  const { asset } = await apiClient.get<{ asset: MetadataAsset }>(`/metadata/assets/${id}`);
  return asset;
}

export async function createAsset(input: CreateAssetInput) {
  const { asset } = await apiClient.post<{ asset: MetadataAsset }>("/metadata/assets", input);
  return asset;
}

export async function updateAsset(id: string, input: Partial<Omit<CreateAssetInput, "projectId" | "workspaceId">>) {
  const { asset } = await apiClient.patch<{ asset: MetadataAsset }>(`/metadata/assets/${id}`, input);
  return asset;
}

export function deleteAsset(id: string) {
  return apiClient.delete<null>(`/metadata/assets/${id}`);
}

type EntityKind = "owners" | "tags" | "domains";
type EntityFor<K extends EntityKind> = K extends "owners" ? MetadataOwner : K extends "tags" ? MetadataTag : MetadataDomain;

async function listEntities<K extends EntityKind>(kind: K, workspaceId?: string): Promise<EntityFor<K>[]> {
  const data = await apiClient.get<Record<string, EntityFor<K>[]>>(`/metadata/${kind}`, { workspaceId });
  return data[kind];
}

async function createEntity<K extends EntityKind>(kind: K, input: { workspaceId: string; name: string; description?: string | null; email?: string | null }): Promise<EntityFor<K>> {
  const singular = kind.slice(0, -1);
  const data = await apiClient.post<Record<string, EntityFor<K>>>(`/metadata/${kind}`, input);
  return data[singular];
}

function deleteEntity(kind: EntityKind, id: string) {
  return apiClient.delete<null>(`/metadata/${kind}/${id}`);
}

export const owners = {
  list: (workspaceId?: string) => listEntities("owners", workspaceId),
  create: (input: { workspaceId: string; name: string; email?: string | null }) => createEntity("owners", input),
  delete: (id: string) => deleteEntity("owners", id),
};

export const tags = {
  list: (workspaceId?: string) => listEntities("tags", workspaceId),
  create: (input: { workspaceId: string; name: string; description?: string | null }) => createEntity("tags", input),
  delete: (id: string) => deleteEntity("tags", id),
};

export const domains = {
  list: (workspaceId?: string) => listEntities("domains", workspaceId),
  create: (input: { workspaceId: string; name: string; description?: string | null }) => createEntity("domains", input),
  delete: (id: string) => deleteEntity("domains", id),
};

export function createLineageEdge(input: { sourceAssetId: string; targetAssetId: string; relationshipType: string; confidence?: number; metadata?: Record<string, unknown> }) {
  return apiClient.post("/metadata/lineage", input);
}

export function getLineageGraph(assetId: string) {
  return apiClient.get<LineageGraph>(`/metadata/lineage/${assetId}/graph`);
}

export function getImpact(assetId: string) {
  return apiClient.get<ImpactAnalysis>(`/metadata/impact/${assetId}`);
}

export async function searchIntelligence(q: string) {
  const { data, meta } = await apiClient.getPaged<{ results: MetadataAsset[] }>("/metadata/intelligence/search", { q });
  return { results: data.results, meta };
}

export function compareSchema(input: { oldColumns: MetadataColumnInput[]; newColumns: MetadataColumnInput[] }) {
  return apiClient.post<{ changes: SchemaChange[] }>("/metadata/schema/compare", input);
}

interface MetadataColumnInput {
  name: string;
  dataType: string;
}
