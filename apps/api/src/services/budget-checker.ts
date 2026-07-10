import { getConfig } from "../services/config.js";
import { getAllUsage, getUsageForProject } from "../modules/usage/service.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");
const ALERTS_FILE = join(DATA_DIR, "budget-alerts.json");

export interface BudgetAlert {
  id: string;
  type: "warning_80" | "critical_100";
  project?: string;
  current_spend: number;
  budget_limit: number;
  percentage: number;
  created_at: string;
  acknowledged: boolean;
}

function loadAlerts(): BudgetAlert[] {
  try {
    if (!existsSync(ALERTS_FILE)) return [];
    const data = JSON.parse(readFileSync(ALERTS_FILE, "utf-8"));
    return Array.isArray(data.alerts) ? data.alerts : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: BudgetAlert[]): void {
  writeFileSync(ALERTS_FILE, JSON.stringify({ alerts }, null, 2));
}

export async function checkBudgets(): Promise<BudgetAlert[]> {
  const cfg = getConfig();
  const alerts = loadAlerts();
  const newAlerts: BudgetAlert[] = [];

  const allUsage = await getAllUsage();
  const totalCost = allUsage.totalCost;
  const totalPct = (totalCost / cfg.monthly_budget_total) * 100;

  if (totalPct >= 100) {
    const exists = alerts.find((a) => a.type === "critical_100" && !a.project);
    if (!exists) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: "critical_100",
        current_spend: totalCost,
        budget_limit: cfg.monthly_budget_total,
        percentage: Math.round(totalPct),
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    }
  } else if (totalPct >= 80) {
    const exists = alerts.find((a) => a.type === "warning_80" && !a.project);
    if (!exists) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: "warning_80",
        current_spend: totalCost,
        budget_limit: cfg.monthly_budget_total,
        percentage: Math.round(totalPct),
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }

  for (const [projectName, limit] of Object.entries(cfg.monthly_budget_per_project)) {
    const projUsage = await getUsageForProject(projectName);
    const projPct = (projUsage.totalCost / (limit || 1)) * 100;
    if (projPct >= 100 && limit > 0) {
      const exists = alerts.find((a) => a.type === "critical_100" && a.project === projectName);
      if (!exists) {
        newAlerts.push({
          id: crypto.randomUUID(),
          type: "critical_100",
          project: projectName,
          current_spend: projUsage.totalCost,
          budget_limit: limit,
          percentage: Math.round(projPct),
          created_at: new Date().toISOString(),
          acknowledged: false,
        });
      }
    } else if (projPct >= 80 && limit > 0) {
      const exists = alerts.find((a) => a.type === "warning_80" && a.project === projectName);
      if (!exists) {
        newAlerts.push({
          id: crypto.randomUUID(),
          type: "warning_80",
          project: projectName,
          current_spend: projUsage.totalCost,
          budget_limit: limit,
          percentage: Math.round(projPct),
          created_at: new Date().toISOString(),
          acknowledged: false,
        });
      }
    }
  }

  if (newAlerts.length > 0) {
    saveAlerts([...alerts, ...newAlerts]);
  }

  return newAlerts;
}

export function getActiveAlerts(): BudgetAlert[] {
  return loadAlerts().filter((a) => !a.acknowledged);
}

export function acknowledgeAlert(id: string): BudgetAlert | null {
  const alerts = loadAlerts();
  const idx = alerts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  alerts[idx].acknowledged = true;
  saveAlerts(alerts);
  return alerts[idx];
}
