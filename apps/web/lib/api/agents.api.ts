import { apiClient, useMockData } from "./client";
import type { Agent, AgentLogEntry } from "@/lib/types";
import { agents, agentLogs } from "@/lib/mocks";

export async function getAgents(): Promise<Agent[]> {
  if (useMockData) {
    return agents;
  }

  return apiClient<Agent[]>("/agents");
}

export async function getAgentLogs(): Promise<AgentLogEntry[]> {
  if (useMockData) {
    return agentLogs;
  }

  return apiClient<AgentLogEntry[]>("/agents/logs");
}
