import { apiClient } from "./client";
import type { GitHubAccount, GitHubRepository, GitHubStatus } from "./types";

export async function getConnectUrl() {
  const { url } = await apiClient.get<{ url: string }>("/github/connect");
  return url;
}

export function getStatus() {
  return apiClient.get<GitHubStatus>("/github/status");
}

export function getAccount() {
  return apiClient.get<GitHubAccount>("/github/account");
}

export async function listRepositories() {
  const { repositories } = await apiClient.get<{ repositories: GitHubRepository[] }>("/github/repositories");
  return repositories;
}

export async function selectRepository(repositoryId: string, projectId: string) {
  const { project } = await apiClient.post<{
    project: { id: string; name: string; slug: string; githubBranch: string | null; githubRepository: Pick<GitHubRepository, "owner" | "name" | "fullName" | "defaultBranch" | "htmlUrl"> };
  }>(`/github/repositories/${repositoryId}/select`, { projectId });
  return project;
}

export function disconnect() {
  return apiClient.delete<null>("/github/connection");
}
