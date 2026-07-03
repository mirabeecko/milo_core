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
