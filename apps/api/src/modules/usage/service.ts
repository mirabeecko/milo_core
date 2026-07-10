import { existsSync, readFileSync, appendFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const usageLogFile = join(DATA_DIR, "usage.log");

export interface UsageEntry {
  project: string;
  agent: string;
  model: string;
  provider: string;
  minutes: number;
  cost_usd: number;
  task_description: string;
  timestamp: string;
}

const MODEL_COSTS: Record<string, number> = {
  "gpt-4o": 0.15,
  "gpt-4o-mini": 0.0075,
  "gpt-4": 0.18,
  "gpt-3.5-turbo": 0.008,
  "claude-3.5-sonnet": 0.18,
  "claude-3-opus": 0.90,
  "claude-3-haiku": 0.0075,
  "gemini-1.5-pro": 0.15,
  "gemini-1.5-flash": 0.00375,
  "moonshot-v1": 0.06,
  "llama3": 0,
  "llama3.1": 0,
  "mistral": 0,
  "codellama": 0,
  "deepseek-coder": 0,
};

export function getModelCost(model: string): number {
  return MODEL_COSTS[model] ?? 0.05;
}

export function calculateCost(model: string, durationMinutes: number): number {
  const rate = getModelCost(model);
  return Math.round(rate * durationMinutes * 100) / 100;
}

export async function logUsage(entry: UsageEntry): Promise<void> {
  const line = JSON.stringify(entry) + "\n";
  try {
    appendFileSync(usageLogFile, line);
  } catch (error) {
    console.error(`Failed to log usage to ${usageLogFile}:`, error);
  }
}

export async function getUsageForProject(project: string): Promise<{
  totalMinutes: number;
  totalCost: number;
  entries: UsageEntry[];
  breakdown: Record<string, { model: string; provider: string; minutes: number; cost: number; tasks: string[] }>;
}> {
  if (!existsSync(usageLogFile)) {
    return { totalMinutes: 0, totalCost: 0, entries: [], breakdown: {} };
  }

  const content = readFileSync(usageLogFile, "utf-8");
  const entries: UsageEntry[] = content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const projectEntries = entries.filter((e) => e.project === project);

  let totalMinutes = 0;
  let totalCost = 0;
  const breakdown: Record<string, { model: string; provider: string; minutes: number; cost: number; tasks: string[] }> = {};

  for (const entry of projectEntries) {
    totalMinutes += entry.minutes;
    totalCost += entry.cost_usd;

    const key = `${entry.agent}-${entry.model}`;
    if (!breakdown[key]) {
      breakdown[key] = {
        model: entry.model,
        provider: entry.provider,
        minutes: 0,
        cost: 0,
        tasks: [],
      };
    }
    breakdown[key].minutes += entry.minutes;
    breakdown[key].cost += entry.cost_usd;
    if (entry.task_description && !breakdown[key].tasks.includes(entry.task_description)) {
      breakdown[key].tasks.push(entry.task_description);
    }
  }

  return {
    totalMinutes: Math.round(totalMinutes * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    entries: projectEntries,
    breakdown,
  };
}

export async function getAllUsage(): Promise<{
  totalMinutes: number;
  totalCost: number;
  byProject: Record<string, { totalMinutes: number; totalCost: number; agentCount: number }>;
}> {
  if (!existsSync(usageLogFile)) {
    return { totalMinutes: 0, totalCost: 0, byProject: {} };
  }

  const content = readFileSync(usageLogFile, "utf-8");
  const entries: UsageEntry[] = content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  let totalMinutes = 0;
  let totalCost = 0;
  const byProject: Record<string, { totalMinutes: number; totalCost: number; agentCount: number }> = {};

  for (const entry of entries) {
    totalMinutes += entry.minutes;
    totalCost += entry.cost_usd;

    if (!byProject[entry.project]) {
      byProject[entry.project] = { totalMinutes: 0, totalCost: 0, agentCount: 0 };
    }
    byProject[entry.project].totalMinutes += entry.minutes;
    byProject[entry.project].totalCost += entry.cost_usd;
    byProject[entry.project].agentCount++;
  }

  return {
    totalMinutes: Math.round(totalMinutes * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    byProject,
  };
}
