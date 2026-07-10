/**
 * LLM Cost Tracker — C-010 capability.
 * Čte cost tracker data z milo-os a reportuje měsíční/včerejší náklady.
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const COST_TRACKER_PATH = "/Users/mb/dev/milo-os/cost_tracker.py";
const LLM_COSTS_LOG = "/Users/mb/dev/milo-os/llm_costs.json";

interface LLMCost {
  date: string;
  provider: string;
  model: string;
  tokens: number;
  cost_czk: number;
  purpose?: string;
}

export function llmCosts(): {
  available: boolean;
  monthly: { total_czk: number; byProvider: Record<string, number>; topModel: string };
  yesterday: { total_czk: number; calls: number };
  details: LLMCost[];
} {
  const empty = { available: false, monthly: { total_czk: 0, byProvider: {}, topModel: "" }, yesterday: { total_czk: 0, calls: 0 }, details: [] };

  // Run the tracker if it exists
  if (existsSync(COST_TRACKER_PATH)) {
    try {
      execSync(`python3 "${COST_TRACKER_PATH}" 2>/dev/null`, { timeout: 15000, encoding: "utf-8" });
    } catch { /* tracker may fail, continue with existing data */ }
  }

  if (!existsSync(LLM_COSTS_LOG)) return empty;

  try {
    const raw = readFileSync(LLM_COSTS_LOG, "utf-8").trim();
    if (!raw) return empty;

    const data = JSON.parse(raw);
    const costs: LLMCost[] = Array.isArray(data) ? data : [];

    if (costs.length === 0) return empty;

    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

    const monthly = costs.filter((c) => c.date?.startsWith(month));
    const yday = costs.filter((c) => c.date?.startsWith(yesterday));

    const byProvider: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    for (const c of monthly) {
      byProvider[c.provider] = (byProvider[c.provider] || 0) + (c.cost_czk || 0);
      byModel[c.model] = (byModel[c.model] || 0) + (c.cost_czk || 0);
    }

    const topModel = Object.entries(byModel).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

    return {
      available: true,
      monthly: {
        total_czk: Math.round(monthly.reduce((s, c) => s + (c.cost_czk || 0), 0) * 100) / 100,
        byProvider: Object.fromEntries(Object.entries(byProvider).map(([k, v]) => [k, Math.round(v * 100) / 100])),
        topModel,
      },
      yesterday: {
        total_czk: Math.round(yday.reduce((s, c) => s + (c.cost_czk || 0), 0) * 100) / 100,
        calls: yday.length,
      },
      details: costs.slice(-20),
    };
  } catch {
    return empty;
  }
}
