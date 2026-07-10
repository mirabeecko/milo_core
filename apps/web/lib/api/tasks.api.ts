import { apiClient } from "./client";
import type { AgentTask, TaskPriority } from "@/lib/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  ownerId: string;
  ownerType: "agent" | "user";
  source?: string;
  toolsUsed?: string[];
  estimateMs?: number;
}

export async function createTask(input: CreateTaskInput): Promise<AgentTask> {
  return apiClient<AgentTask>("/tasks", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      status: "pending",
      source: input.source ?? "user",
      toolsUsed: input.toolsUsed ?? [],
      log: [],
      citations: [],
      retryCount: 0,
    }),
  });
}

export async function getTasks(options?: {
  status?: string;
  ownerId?: string;
  limit?: number;
}): Promise<AgentTask[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.ownerId) params.set("ownerId", options.ownerId);
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  return apiClient<AgentTask[]>(`/tasks${query ? `?${query}` : ""}`);
}
