import { apiClient } from "./client";

export interface Mission {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  status: string;
  priority: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
}

export async function getMissions(): Promise<Mission[]> {
  return apiClient<Mission[]>("/missions");
}

export async function getMission(id: string): Promise<Mission> {
  return apiClient<Mission>(`/missions/${encodeURIComponent(id)}`);
}
