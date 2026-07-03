import { apiClient, useMockData } from "./client";
import type { Agent, AgentLogEntry, AgentTask, CalendarAgentState, CommunicationAgentState, DeveloperAgentState, LiveWorkExplanation } from "@/lib/types";

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

export async function restartAgent(id: string): Promise<void> {
  await apiClient(`/agents/${id}/restart`, { method: "POST" });
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

export async function getAgentTaskHistory(id: string): Promise<AgentTask[]> {
  return apiClient<AgentTask[]>(`/agents/${id}/tasks/history`);
}

export async function getAgentTaskQueue(id: string): Promise<AgentTask[]> {
  return apiClient<AgentTask[]>(`/agents/${id}/tasks/queue`);
}

export async function getAgentCalendarState(id: string): Promise<CalendarAgentState> {
  return apiClient<CalendarAgentState>(`/agents/${id}/calendar/state`);
}

export async function syncAgentCalendar(id: string): Promise<{ status: string; state: CalendarAgentState }> {
  return apiClient<{ status: string; state: CalendarAgentState }>(`/agents/${id}/calendar/sync`, { method: "POST" });
}

export async function getAgentCommunicationState(id: string): Promise<CommunicationAgentState> {
  return apiClient<CommunicationAgentState>(`/agents/${id}/communication/state`);
}

export async function syncAgentCommunication(id: string): Promise<{ status: string; state: CommunicationAgentState }> {
  return apiClient<{ status: string; state: CommunicationAgentState }>(`/agents/${id}/communication/sync`, { method: "POST" });
}

export async function getAgentDeveloperState(id: string): Promise<DeveloperAgentState> {
  return apiClient<DeveloperAgentState>(`/agents/${id}/developer/state`);
}

export async function syncAgentDeveloper(id: string): Promise<{ status: string; state: DeveloperAgentState }> {
  return apiClient<{ status: string; state: DeveloperAgentState }>(`/agents/${id}/developer/sync`, { method: "POST" });
}
