import { apiClient } from "./client";
import type { User } from "./types";

export interface AuthResult {
  user: User;
  token: string;
}

export function register(input: { name: string; email: string; password: string }) {
  return apiClient.post<AuthResult>("/auth/register", input);
}

export function login(input: { email: string; password: string }) {
  return apiClient.post<AuthResult>("/auth/login", input);
}

export async function me() {
  const { user } = await apiClient.get<{ user: User }>("/auth/me");
  return user;
}

export function logout() {
  return apiClient.post<null>("/auth/logout");
}
