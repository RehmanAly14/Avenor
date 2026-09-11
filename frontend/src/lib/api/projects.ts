import { apiClient } from "./client";
import type { Project } from "./types";

export async function listProjects(params?: { page?: number; limit?: number }) {
  const { data, meta } = await apiClient.getPaged<{ projects: Project[] }>("/projects", params);
  return { projects: data.projects, meta };
}

export async function getProject(slug: string) {
  const { project } = await apiClient.get<{ project: Project }>(`/projects/${slug}`);
  return project;
}

export async function createProject(input: { name: string; description?: string | null; slug?: string }) {
  const { project } = await apiClient.post<{ project: Project }>("/projects", input);
  return project;
}

export async function updateProject(slug: string, input: { name?: string; description?: string | null }) {
  const { project } = await apiClient.patch<{ project: Project }>(`/projects/${slug}`, input);
  return project;
}

export function deleteProject(slug: string) {
  return apiClient.delete<null>(`/projects/${slug}`);
}
