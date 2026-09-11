import { apiClient } from "./client";
import type { User } from "./types";

export async function getMe() {
  const { user } = await apiClient.get<{ user: User }>("/users/me");
  return user;
}

export async function updateMe(input: { name?: string; avatar?: string | null }) {
  const { user } = await apiClient.patch<{ user: User }>("/users/me", input);
  return user;
}

export function deleteMe() {
  return apiClient.delete<null>("/users/me");
}
