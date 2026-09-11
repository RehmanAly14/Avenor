import { apiClient } from "./client";
import type { DataIncidentSeverity, DataIncidentStatus, FixDetail, Investigation, InvestigationReport, TimelineEvent } from "./types";

export interface CreateInvestigationInput {
  projectId: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  severity?: DataIncidentSeverity;
}

export async function listInvestigations(params?: { projectId?: string; workspaceId?: string; status?: DataIncidentStatus; page?: number; limit?: number }) {
  const { data, meta } = await apiClient.getPaged<{ investigations: Investigation[] }>("/investigations", params);
  return { investigations: data.investigations, meta };
}

export async function getInvestigation(id: string) {
  const { investigation } = await apiClient.get<{ investigation: Investigation }>(`/investigations/${id}`);
  return investigation;
}

export async function createInvestigation(input: CreateInvestigationInput) {
  const { investigation } = await apiClient.post<{ investigation: Investigation }>("/investigations", input);
  return investigation;
}

export interface RunResult {
  investigationId: string;
  status: string;
  error: string | null;
}

export function runInvestigation(id: string) {
  return apiClient.post<RunResult>(`/investigations/${id}/run`);
}

export function getInvestigationStatus(id: string) {
  return apiClient.get<{ id: string; stage: string; status?: string; error: string | null }>(`/investigations/${id}/status`);
}

export function getInvestigationReport(id: string) {
  return apiClient.get<InvestigationReport>(`/investigations/${id}/report`);
}

export async function getTimeline(id: string) {
  const { timeline } = await apiClient.get<{ timeline: TimelineEvent[] }>(`/investigations/${id}/timeline`);
  return timeline;
}

export function getFix(id: string) {
  return apiClient.get<FixDetail>(`/investigations/${id}/fix`);
}

export function validateFix(id: string) {
  return apiClient.post<FixDetail>(`/investigations/${id}/fix/validate`);
}

export interface ApproveFixResult extends FixDetail {
  githubError: string | null;
}

export function approveFix(id: string) {
  return apiClient.post<ApproveFixResult>(`/investigations/${id}/fix/approve`);
}

export function rejectFix(id: string, reason?: string) {
  return apiClient.post<FixDetail>(`/investigations/${id}/fix/reject`, { reason });
}

export function retryPullRequest(id: string) {
  return apiClient.post<{ branch: string; prNumber: number; prUrl: string }>(`/investigations/${id}/fix/pr`);
}
