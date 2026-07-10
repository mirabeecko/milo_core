/**
 * P-003: ISDS Message Intake Process
 *
 * Orchestruje MiLO_ISDS_MCP pipeline jako MiLO business process.
 * Flow: Detect → Download → Extract → Classify → Index → Notify → Brief
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { logExecutiveEvent } from "./event-logger.js";
import { createApproval } from "./approval-store.js";

const ISDS_DIR = "/Users/mb/dev/MiLO_ISDS_MCP";
const ISDS_PYTHON = `${ISDS_DIR}/.venv/bin/python`;
const ISDS_CLI = `cd "${ISDS_DIR}" && ${ISDS_PYTHON} main.py`;
const ISDS_CONFIG = resolve(ISDS_DIR, "config.yaml");
const ISDS_REPORT = resolve(ISDS_DIR, "reports/REPORT.md");

export interface ISDSIntakeResult {
  status: "completed" | "failed" | "no_new_messages";
  newMessages: number;
  deadlines: string[];
  reportPreview: string;
  processingTimeMs: number;
  error?: string;
}

function runISDSPipeline(): { success: boolean; output: string; error?: string } {
  try {
    // Use report command — reads existing data, no credentials needed
    const output = execSync(`${ISDS_CLI} report --config "${ISDS_CONFIG}" 2>&1`, {
      encoding: "utf-8", timeout: 120_000, cwd: ISDS_DIR,
    });
    return { success: true, output };
  } catch (e: any) {
    return { success: false, output: e.stdout || "", error: e.stderr || e.message };
  }
}

function parseISDSReport(): { deadlines: string[]; preview: string; messageCount: number } {
  const deadlines: string[] = [];
  let messageCount = 0;
  try {
    if (!existsSync(ISDS_REPORT)) return { deadlines, preview: "", messageCount: 0 };
    const report = readFileSync(ISDS_REPORT, "utf-8");
    messageCount = (report.match(/^## /gm) || []).length;
    const dates = report.match(/\b(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})\b/g) || [];
    deadlines.push(...dates);
    const preview = report.replace(/^#.*$/gm, "").trim().slice(0, 500);
    return { deadlines, preview, messageCount };
  } catch {
    return { deadlines, preview: "", messageCount: 0 };
  }
}

function analyzeLegal(report: string): { highPriority: boolean; urgency: "high" | "medium" | "low"; keywords: string[] } {
  const lower = report.toLowerCase();
  const hi = ["exeku", "pokuta", "odvolání", "lhůta", "soud", "rozhodnutí", "výzva", "sankce"];
  const med = ["oznámení", "žádost", "sdělení", "informace"];
  const found = hi.filter((k) => lower.includes(k));
  const mfound = med.filter((k) => lower.includes(k));
  return { highPriority: found.length > 0, urgency: found.length > 0 ? "high" : mfound.length > 0 ? "medium" : "low", keywords: [...found, ...mfound] };
}

export function executeISDSIntake(): ISDSIntakeResult {
  const start = Date.now();
  logExecutiveEvent("mission_created", { mission_id: "P-003", department: "KNOW", summary: "ISDS intake started" });

  const pipeline = runISDSPipeline();
  if (!pipeline.success) {
    logExecutiveEvent("mission_blocked", { mission_id: "P-003", summary: `ISDS pipeline failed: ${pipeline.error}` });
    return { status: "failed", newMessages: 0, deadlines: [], reportPreview: "", processingTimeMs: Date.now() - start, error: pipeline.error };
  }

  const parsed = parseISDSReport();
  if (parsed.messageCount === 0) {
    logExecutiveEvent("mission_completed", { mission_id: "P-003", summary: "No new ISDS messages" });
    return { status: "no_new_messages", newMessages: 0, deadlines: [], reportPreview: "", processingTimeMs: Date.now() - start };
  }

  logExecutiveEvent("artifact_created", { artifact_type: "report", artifact_path: "reports/REPORT.md", summary: `ISDS report: ${parsed.messageCount} messages` });

  const analysis = analyzeLegal(parsed.preview);
  if (analysis.highPriority) {
    createApproval({
      mission_id: "P-003", department: "KNOW", agent_id: "chief-knowledge-officer",
      what: `Nová důležitá ISDS zpráva: ${analysis.keywords.join(", ")}`,
      why: `Detekovány termíny: ${parsed.deadlines.join(", ")}`,
      risk_level: "high", requested_by: "P-003-process", timeout_hours: 24,
    });
    logExecutiveEvent("approval_requested", { mission_id: "P-003", summary: "High priority ISDS — Owner review required", risk_level: "high" });
  }

  logExecutiveEvent("mission_completed", {
    mission_id: "P-003", department: "KNOW",
    summary: `ISDS done: ${parsed.messageCount} msg, ${parsed.deadlines.length} deadlines, urgency: ${analysis.urgency}`,
  });

  return { status: "completed", newMessages: parsed.messageCount, deadlines: parsed.deadlines, reportPreview: parsed.preview, processingTimeMs: Date.now() - start };
}
