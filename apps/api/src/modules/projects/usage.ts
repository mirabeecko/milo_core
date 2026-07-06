import { existsSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

const usageLogFile = join(process.cwd(), "apps/api/data/usage.log");

export async function logUsage(entry: {
  project: string;
  agent: string;
  model: string;
  provider: string;
  minutes: number;
  cost_usd: number;
  task_description: string;
  timestamp: string;
}): Promise<void> {
  const line = JSON.stringify(entry) + "\n";
  appendFileSync(usageLogFile, line);
}

export async function getUsageForProject(projectId: string): Promise<{
  totalMinutes: number;
  totalCost: number;
  breakdown: Record<string, { model: string; provider: string; minutes: number; cost: number }>;
}> {
  if (!existsSync(usageLogFile)) {
    return { totalMinutes: 0, totalCost: 0, breakdown: {} };
  }

  const content = readFileSync(usageLogFile, "utf-8");
  const entries = content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const projectEntries = entries.filter((e) => e.project === projectId);

  let totalMinutes = 0;
  let totalCost = 0;
  const breakdown: Record<string, { model: string; provider: string; minutes: number; cost: number }> = {};

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
      };
    }
    breakdown[key].minutes += entry.minutes;
    breakdown[key].cost += entry.cost_usd;
  }

  return {
    totalMinutes,
    totalCost,
    breakdown,
  };
}
