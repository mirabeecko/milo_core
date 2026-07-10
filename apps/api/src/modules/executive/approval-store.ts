/**
 * Owner Approval Store — persistentní fronta schvalování.
 * Ukládá do JSON souboru, přežije restart.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../../data");
const APPROVALS_FILE = resolve(DATA_DIR, "approvals.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface Approval {
  id: string;
  mission_id: string;
  department: string;
  agent_id: string;
  what: string;
  why: string;
  risk_level: "low" | "medium" | "high" | "critical";
  status: ApprovalStatus;
  requested_by: string;
  requested_at: string;
  decided_by?: string;
  decided_at?: string;
  reason?: string;
  timeout_hours: number;
}

function loadApprovals(): Approval[] {
  if (!existsSync(APPROVALS_FILE)) return [];
  return JSON.parse(readFileSync(APPROVALS_FILE, "utf-8"));
}

function saveApprovals(approvals: Approval[]): void {
  writeFileSync(APPROVALS_FILE, JSON.stringify(approvals, null, 2));
}

export function listApprovals(status?: ApprovalStatus): Approval[] {
  const all = loadApprovals();
  return status ? all.filter((a) => a.status === status) : all;
}

export function getApproval(id: string): Approval | undefined {
  return loadApprovals().find((a) => a.id === id);
}

export function createApproval(input: Omit<Approval, "id" | "status" | "requested_at">): Approval {
  const approvals = loadApprovals();
  const a: Approval = {
    ...input,
    id: `APR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: "pending",
    requested_at: new Date().toISOString(),
  };
  approvals.push(a);
  saveApprovals(approvals);
  return a;
}

export function decideApproval(
  id: string,
  decision: "approved" | "rejected",
  reason: string,
  decidedBy: string,
): Approval | undefined {
  const approvals = loadApprovals();
  const a = approvals.find((x) => x.id === id);
  if (!a || a.status !== "pending") return undefined;
  a.status = decision;
  a.decided_by = decidedBy;
  a.decided_at = new Date().toISOString();
  a.reason = reason;
  saveApprovals(approvals);
  return a;
}

export function getPendingCount(): number {
  return listApprovals("pending").length;
}
