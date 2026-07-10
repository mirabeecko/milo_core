import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllUsage } from "../modules/usage/service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");
const SUMMARY_FILE = join(DATA_DIR, "weekly-summary.json");

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  generated_at: string;
  summary_text: string;
  hours: number;
  cost: number;
  projects_advanced: Array<{ project: string; description: string }>;
  projects_stalled: Array<{ project: string }>;
  agent_activity: Record<string, number>;
}

export async function generateWeeklySummary(): Promise<WeeklySummary> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekStart = monday.toISOString().split("T")[0]!;
  const weekEnd = sunday.toISOString().split("T")[0]!;

  const allUsage = await getAllUsage();

  const projectsAdvanced: WeeklySummary["projects_advanced"] = [];
  const projectsStalled: WeeklySummary["projects_stalled"] = [];
  const agentActivity: Record<string, number> = {};

  let totalMinutes = 0;
  let totalCost = 0;

  for (const [project, data] of Object.entries(allUsage.byProject)) {
    totalMinutes += data.totalMinutes;
    totalCost += data.totalCost;
    if (data.totalMinutes > 0) {
      projectsAdvanced.push({
        project,
        description: `${data.agentCount} LLM volání, ${data.totalMinutes.toFixed(1)} min`,
      });
    } else {
      projectsStalled.push({ project });
    }
  }

  const summaryText = [
    `Týdenní shrnutí: ${weekStart} – ${weekEnd}`,
    ``,
    `Celkem stráveno: ${totalMinutes.toFixed(1)} minut s LLM modely`,
    `Celkové náklady: $${totalCost.toFixed(2)}`,
    ``,
    `Aktivní projekty (${projectsAdvanced.length}):`,
    ...projectsAdvanced.map((p) => `  - ${p.project}: ${p.description}`),
    ``,
    `Projekty bez aktivity (${projectsStalled.length}):`,
    ...projectsStalled.map((p) => `  - ${p.project}`),
  ].join("\n");

  const summary: WeeklySummary = {
    week_start: weekStart,
    week_end: weekEnd,
    generated_at: new Date().toISOString(),
    summary_text: summaryText,
    hours: Math.round((totalMinutes / 60) * 10) / 10,
    cost: Math.round(totalCost * 100) / 100,
    projects_advanced: projectsAdvanced,
    projects_stalled: projectsStalled,
    agent_activity: agentActivity,
  };

  writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));

  return summary;
}

export function getLatestSummary(): WeeklySummary | null {
  try {
    if (!existsSync(SUMMARY_FILE)) return null;
    return JSON.parse(readFileSync(SUMMARY_FILE, "utf-8"));
  } catch {
    return null;
  }
}
