export interface UsageLogEntry {
  project: string;
  agent: string;
  model: string;
  provider: string;
  minutes: number;
  cost_usd: number;
  task_description: string;
  timestamp: string;
}

export interface UsageSummary {
  totalMinutes: number;
  totalCost: number;
  breakdown: Record<string, { model: string; provider: string; minutes: number; cost: number }>;
}
