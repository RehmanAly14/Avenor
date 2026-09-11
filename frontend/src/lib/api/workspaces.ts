import { apiClient } from "./client";
import type { Workspace } from "./types";

export async function listWorkspaces(params?: { page?: number; limit?: number }) {
  const { data, meta } = await apiClient.getPaged<{ workspaces: Workspace[] }>("/workspaces", params);
  return { workspaces: data.workspaces, meta };
}

export async function getWorkspace(slug: string) {
  const { workspace } = await apiClient.get<{ workspace: Workspace }>(`/workspaces/${slug}`);
  return workspace;
}

export async function createWorkspace(input: { name: string; description?: string | null; slug?: string }) {
  const { workspace } = await apiClient.post<{ workspace: Workspace }>("/workspaces", input);
  return workspace;
}

export async function updateWorkspace(slug: string, input: { name?: string; description?: string | null }) {
  const { workspace } = await apiClient.patch<{ workspace: Workspace }>(`/workspaces/${slug}`, input);
  return workspace;
}

export function deleteWorkspace(slug: string) {
  return apiClient.delete<null>(`/workspaces/${slug}`);
}
