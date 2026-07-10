/**
 * Executive Event Logger — zapisuje události podle telemetry-contract.json
 * do souboru, který dashboard konzumuje.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../../../..");
const DATA_DIR = resolve(REPO_ROOT, "apps/api/data");
const EVENTS_FILE = resolve(DATA_DIR, "executive-events.jsonl");

// Zajistit, že data adresář existuje
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

/** Typy událostí podle telemetry-contract.json */
export type ExecutiveEventType =
  | "objective_started"
  | "mission_created"
  | "mission_assigned"
  | "mission_progress"
  | "mission_blocked"
  | "mission_completed"
  | "agent_created"
  | "agent_started"
  | "agent_waiting"
  | "agent_failed"
  | "artifact_created"
  | "decision_proposed"
  | "decision_approved"
  | "risk_raised"
  | "approval_requested"
  | "approval_granted"
  | "approval_rejected";

export interface ExecutiveEvent {
  event_id: string;
  event_type: ExecutiveEventType;
  timestamp: string;
  department?: string;
  agent_id?: string;
  mission_id?: string;
  summary?: string;
  payload: Record<string, unknown>;
}

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Zapíše událost do persistentního logu (JSONL — jeden JSON na řádek) */
export function logExecutiveEvent(
  event_type: ExecutiveEventType,
  payload: Record<string, unknown>,
): void {
  const event: ExecutiveEvent = {
    event_id: generateId(),
    event_type,
    timestamp: new Date().toISOString(),
    department: (payload.department as string) || undefined,
    agent_id: (payload.agent_id as string) || undefined,
    mission_id: (payload.mission_id as string) || undefined,
    summary: (payload.summary as string) || undefined,
    payload,
  };
  appendFileSync(EVENTS_FILE, JSON.stringify(event) + "\n");
}

/** Přečte posledních N událostí */
export function readRecentEvents(limit = 50): ExecutiveEvent[] {
  if (!existsSync(EVENTS_FILE)) return [];
  const lines = readFileSync(EVENTS_FILE, "utf-8").trim().split("\n");
  const recent = lines.slice(-limit);
  return recent
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .reverse();
}

/** Přečte události filtrované podle typu */
export function readEventsByType(
  event_type: ExecutiveEventType,
  limit = 50,
): ExecutiveEvent[] {
  if (!existsSync(EVENTS_FILE)) return [];
  const lines = readFileSync(EVENTS_FILE, "utf-8").trim().split("\n");
  return lines
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((e) => e.event_type === event_type)
    .slice(-limit)
    .reverse();
}
