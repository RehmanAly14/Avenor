import { apiClient } from "./client";

export type DocumentStatus = "UPLOADED" | "PENDING" | "FAILED";

export interface AvenorDocument {
  id: string;
  projectId: string;
  workspaceId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export async function listDocuments(params?: { projectId?: string; workspaceId?: string; page?: number; limit?: number }) {
  const { data, meta } = await apiClient.getPaged<{ documents: AvenorDocument[] }>("/documents", params);
  return { documents: data.documents, meta };
}

export async function uploadDocument(input: { projectId: string; workspaceId: string; file: File }) {
  const formData = new FormData();
  formData.append("projectId", input.projectId);
  formData.append("workspaceId", input.workspaceId);
  formData.append("file", input.file);
  const { document } = await apiClient.post<{ document: AvenorDocument }>("/documents/upload", formData, { isFormData: true });
  return document;
}

export function deleteDocument(id: string) {
  return apiClient.delete<null>(`/documents/${id}`);
}
