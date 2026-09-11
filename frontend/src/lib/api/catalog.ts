import { apiClient } from "./client";
import type { MetadataAsset } from "./types";

export type CatalogQuery = {
  projectId?: string;
  workspaceId?: string;
  q?: string;
  tag?: string;
  owner?: string;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function listCatalogAssets(params?: CatalogQuery) {
  const { data, meta } = await apiClient.getPaged<{ assets: MetadataAsset[] }>("/catalog/assets", params);
  return { assets: data.assets, meta };
}

export async function searchCatalog(params: CatalogQuery) {
  const { data, meta } = await apiClient.getPaged<{ assets: MetadataAsset[] }>("/catalog/search", params);
  return { assets: data.assets, meta };
}

export async function getCatalogAsset(id: string) {
  const { asset } = await apiClient.get<{ asset: MetadataAsset }>(`/catalog/${id}`);
  return asset;
}
