import { apiClient } from "./client";

export type TaskComplexity = "simple" | "standard" | "complex";

export interface ModelConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

export interface AiSettings {
  defaultProvider: string;
  models: Record<TaskComplexity, ModelConfig>;
}

export async function getAiSettings(): Promise<AiSettings> {
  return apiClient<AiSettings>("/settings/ai");
}

export async function saveAiSettings(input: AiSettings): Promise<AiSettings> {
  return apiClient<AiSettings>("/settings/ai", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
