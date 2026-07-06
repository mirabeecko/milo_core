import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface ActivityLog {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  message: string;
  type: "task" | "error" | "info" | "warning";
  metadata?: Record<string, unknown>;
}

export interface ActivityResponse {
  activity: ActivityLog[];
  total: number;
}

export async function getActivityLogs(limit?: number): Promise<ApiResponse<ActivityLog[]>> {
  const response = await apiClient<ApiResponse<ActivityLog[]>>("/activity", {
    method: "POST",
    body: JSON.stringify({ limit }),
  });
  return response;
}

export async function getAgentActivity(agentId: string, limit?: number): Promise<ApiResponse<ActivityLog[]>> {
  const response = await apiClient<ApiResponse<ActivityLog[]>>(`/agents/${agentId}/activity`, {
    method: "POST",
    body: JSON.stringify({ limit }),
  });
  return response;
}
