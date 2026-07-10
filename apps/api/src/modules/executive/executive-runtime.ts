/**
 * ExecutiveRuntime — orchestrační vrstva nad AgentManagerem.
 *
 * Přidává Executive Organization sémantiku:
 *   - Routování misí Chief → Department → Worker
 *   - Vytváření/rušení Worker agentů
 *   - Quality review krok
 *   - State recovery po restartu
 */
import type { AgentManager } from "@milo/agents";
import { AgentEntityImpl } from "@milo/agents";
import type { AgentDefinition, Mission, CreateMissionInput } from "@milo/shared";
import { logExecutiveEvent } from "./event-logger.js";
import { createApproval, decideApproval } from "./approval-store.js";

// ─── Typy ────────────────────────────────────────────────────────────

export type MissionLifecycleStatus =
  | "queued"
  | "assigned"
  | "running"
  | "waiting"
  | "blocked"
  | "review"
  | "approval"
  | "completed"
  | "failed";

export interface ExecutiveMission extends Mission {
  lifecycleStatus: MissionLifecycleStatus;
  department?: string;
  assignedAgent?: string;
  workerAgentId?: string;
  qualityReview?: {
    passed: boolean;
    reviewer: string;
    findings: string;
    reviewedAt: string;
  };
  approvalId?: string;
}

// ─── In-memory store ─────────────────────────────────────────────────

const executiveMissions = new Map<string, ExecutiveMission>();

function promote(m: Mission): ExecutiveMission {
  const existing = executiveMissions.get(m.id);
  if (existing) {
    Object.assign(existing, m);
    return existing;
  }
  const em: ExecutiveMission = {
    ...m,
    lifecycleStatus: m.status === "running" ? "running" : "queued",
  };
  executiveMissions.set(m.id, em);
  return em;
}

// ─── Department routing ──────────────────────────────────────────────

const DEPARTMENT_ROUTING: Record<string, string[]> = {
  architecture: ["ARCH"],
  code: ["ENG"], implement: ["ENG"], build: ["ENG"], deploy: ["ENG", "OPS"],
  infrastructure: ["OPS"], monitor: ["OPS"], backup: ["OPS"],
  document: ["KNOW"], knowledge: ["KNOW"], search: ["KNOW"], index: ["KNOW"],
  communicate: ["COMM"], message: ["COMM"], telegram: ["COMM"], email: ["COMM"], voice: ["COMM"],
  test: ["QA"], quality: ["QA"], review: ["QA"], audit: ["QA"],
  coordinate: ["OC"], strategy: ["OC"], budget: ["OC"], report: ["OC"],
};

function routeToDepartment(title: string, description?: string): string {
  const text = (title + " " + (description || "")).toLowerCase();
  for (const [keyword, depts] of Object.entries(DEPARTMENT_ROUTING)) {
    if (text.includes(keyword)) return depts[0];
  }
  return "OC";
}

// ─── Executive Runtime ───────────────────────────────────────────────

export class ExecutiveRuntime {
  private manager: AgentManager;

  constructor(manager: AgentManager) {
    this.manager = manager;
  }

  getManager(): AgentManager { return this.manager; }

  // ─── Mission lifecycle ────────────────────────────────────────────

  async submitObjective(input: CreateMissionInput): Promise<ExecutiveMission> {
    const mission = await this.manager.createMission(input);
    const em = promote(mission);
    em.lifecycleStatus = "queued";
    em.department = routeToDepartment(input.title, input.description);
    logExecutiveEvent("mission_created", { mission_id: mission.id, department: em.department, summary: mission.title });
    return em;
  }

  async assignToDepartment(missionId: string): Promise<ExecutiveMission> {
    const em = executiveMissions.get(missionId);
    if (!em) throw new Error(`Mission ${missionId} not found`);
    em.lifecycleStatus = "assigned";
    logExecutiveEvent("mission_assigned", { mission_id: missionId, department: em.department, summary: `Přiřazeno ${em.department}` });
    return em;
  }

  async executeMission(missionId: string, options?: { workerSkill?: string }): Promise<ExecutiveMission> {
    const em = executiveMissions.get(missionId);
    if (!em) throw new Error(`Mission ${missionId} not found`);
    em.lifecycleStatus = "running";
    logExecutiveEvent("mission_progress", { mission_id: missionId, department: em.department, new_status: "running", summary: "Mise spuštěna" });
    if (options?.workerSkill) {
      const worker = await this.createWorker(missionId, options.workerSkill);
      em.workerAgentId = worker.id;
      em.assignedAgent = worker.id;
      logExecutiveEvent("agent_created", { agent_id: worker.id, department: em.department, summary: `Worker ${worker.name}` });
    }
    return em;
  }

  async submitForReview(missionId: string): Promise<ExecutiveMission> {
    const em = executiveMissions.get(missionId);
    if (!em) throw new Error(`Mission ${missionId} not found`);
    em.lifecycleStatus = "review";
    logExecutiveEvent("mission_progress", { mission_id: missionId, department: "QA", new_status: "review", summary: "Předáno QA" });
    return em;
  }

  async completeReview(missionId: string, passed: boolean, findings: string, reviewer: string): Promise<ExecutiveMission> {
    const em = executiveMissions.get(missionId);
    if (!em) throw new Error(`Mission ${missionId} not found`);
    em.qualityReview = { passed, reviewer, findings, reviewedAt: new Date().toISOString() };
    em.lifecycleStatus = passed ? "completed" : "failed";
    logExecutiveEvent(passed ? "mission_completed" : "mission_blocked", {
      mission_id: missionId, department: em.department,
      summary: passed ? "QA passed" : `QA failed: ${findings}`,
    });
    if (em.workerAgentId) { await this.destroyWorker(em.workerAgentId); em.workerAgentId = undefined; }
    return em;
  }

  async requestApproval(missionId: string, what: string, why: string, riskLevel: "low" | "medium" | "high" | "critical" = "low"): Promise<ExecutiveMission> {
    const em = executiveMissions.get(missionId);
    if (!em) throw new Error(`Mission ${missionId} not found`);
    em.lifecycleStatus = "approval";
    const approval = createApproval({ mission_id: missionId, department: em.department || "unknown", agent_id: "chief", what, why, risk_level: riskLevel, requested_by: "chief", timeout_hours: 48 });
    em.approvalId = approval.id;
    return em;
  }

  async grantApproval(missionId: string, reason: string, decidedBy = "owner"): Promise<ExecutiveMission> {
    const em = executiveMissions.get(missionId);
    if (!em) throw new Error(`Mission ${missionId} not found`);
    if (!em.approvalId) throw new Error("No pending approval");
    decideApproval(em.approvalId, "approved", reason, decidedBy);
    em.lifecycleStatus = "assigned";
    return em;
  }

  // ─── Worker management ────────────────────────────────────────────

  private async createWorker(missionId: string, skill: string): Promise<{ id: string; name: string }> {
    const workerId = `worker-${missionId}-${Date.now()}`;
    const def: AgentDefinition = {
      id: workerId, name: `Worker: ${skill}`, description: `Dočasný worker pro misi ${missionId}`,
      role: "worker", specialization: skill, priority: "normal",
      config: {
        model: "provider-agnostic", temperature: 0.3,
        systemPrompt: `Jsi Worker Agent: ${skill}. Mise: ${missionId}.`,
        knowledge: [], tools: ["shell:exec", "fs:read"],
        permissions: { canRead: ["*"], canWrite: [], canExecute: ["shell:exec"] },
        retryPolicy: { maxRetries: 2, backoffMs: 1000 }, timeoutMs: 120000,
      },
    };
    await this.manager.register(def, (agentDef, deps) => new AgentEntityImpl(agentDef, deps));
    await this.manager.start(workerId);
    logExecutiveEvent("agent_started", { agent_id: workerId, summary: `Worker ${def.name} nastartován` });
    return { id: workerId, name: def.name };
  }

  private async destroyWorker(workerId: string): Promise<void> {
    try { await this.manager.stop(workerId); await this.manager.unregister(workerId); } catch { /* už neexistuje */ }
    logExecutiveEvent("agent_failed", { agent_id: workerId, summary: "Worker deaktivován" });
  }

  // ─── Query ─────────────────────────────────────────────────────────

  getMission(id: string): ExecutiveMission | undefined { return executiveMissions.get(id); }
  listMissions(): ExecutiveMission[] { return [...executiveMissions.values()]; }
  listActiveMissions(): ExecutiveMission[] { return this.listMissions().filter((m) => !["completed", "failed"].includes(m.lifecycleStatus)); }

  async recover(): Promise<void> {
    const missions = await this.manager.getMissions({});
    for (const m of missions) promote(m);
    logExecutiveEvent("objective_started", { summary: "ExecutiveRuntime recovered", department: "OC" });
  }
}
