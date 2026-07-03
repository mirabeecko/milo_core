import { apiClient, useMockData } from "./client";
import type { Agent, AgentLogEntry, LiveWorkExplanation } from "@/lib/types";

export async function getAgents(): Promise<Agent[]> {
  return apiClient<Agent[]>("/agents");
}

export async function getAgent(id: string): Promise<Agent> {
  return apiClient<Agent>(`/agents/${id}`);
}

export async function startAgent(id: string): Promise<void> {
  await apiClient(`/agents/${id}/start`, { method: "POST" });
}

export async function stopAgent(id: string): Promise<void> {
  await apiClient(`/agents/${id}/stop`, { method: "POST" });
}

export async function pauseAgent(id: string): Promise<void> {
  await apiClient(`/agents/${id}/pause`, { method: "POST" });
}

export async function resumeAgent(id: string): Promise<void> {
  await apiClient(`/agents/${id}/resume`, { method: "POST" });
}

export async function getAgentLogs(id: string, limit?: number): Promise<AgentLogEntry[]> {
  const query = limit ? `?limit=${limit}` : "";
  return apiClient<AgentLogEntry[]>(`/agents/${id}/logs${query}`);
}

export async function getAgentMetrics(id: string, limit?: number): Promise<unknown[]> {
  const query = limit ? `?limit=${limit}` : "";
  return apiClient<unknown[]>(`/agents/${id}/metrics${query}`);
}

export async function getAgentMemory(id: string): Promise<unknown[]> {
  return apiClient<unknown[]>(`/agents/${id}/memory`);
}

export async function getAgentExplanation(id: string): Promise<LiveWorkExplanation> {
  return apiClient<LiveWorkExplanation>(`/agents/${id}/explanation`);
}
