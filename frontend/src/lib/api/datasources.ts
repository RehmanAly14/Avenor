import { apiClient } from "./client";
import type { DataSource, DataSourceProvider, DataSourceSyncSummary } from "./types";

export interface CreateDataSourceInput {
  projectId: string;
  workspaceId: string;
  name: string;
  provider: DataSourceProvider;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export async function listDataSources(params?: { projectId?: string; workspaceId?: string; page?: number; limit?: number }) {
  const { data, meta } = await apiClient.getPaged<{ dataSources: DataSource[] }>("/datasources", params);
  return { dataSources: data.dataSources, meta };
}

export async function getDataSource(id: string) {
  const { dataSource } = await apiClient.get<{ dataSource: DataSource }>(`/datasources/${id}`);
  return dataSource;
}

export async function createDataSource(input: CreateDataSourceInput) {
  const { dataSource } = await apiClient.post<{ dataSource: DataSource }>("/datasources", input);
  return dataSource;
}

export async function updateDataSource(id: string, input: Partial<Omit<CreateDataSourceInput, "projectId" | "workspaceId">>) {
  const { dataSource } = await apiClient.patch<{ dataSource: DataSource }>(`/datasources/${id}`, input);
  return dataSource;
}

export function deleteDataSource(id: string) {
  return apiClient.delete<null>(`/datasources/${id}`);
}

export async function syncDataSource(id: string) {
  const { summary } = await apiClient.post<{ summary: DataSourceSyncSummary }>(`/datasources/${id}/sync`);
  return summary;
}
