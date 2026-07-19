/**
 * Executive Agent — plnohodnotná implementace pro všech 7 Executive Agentů.
 *
 * Každý Executive Agent může:
 * - Přijímat a vykonávat mise (executive:mission)
 * - Generovat Executive Brief (executive:brief)
 * - Vyhledávat v dokumentech (executive:search)
 * - Kontrolovat Docker kontejnery (executive:docker)
 * - Prioritizovat projekty (executive:projects)
 * - Sledovat LLM náklady (executive:costs)
 * - Číst System Registry (executive:system)
 * - Spouštět audit (executive:audit)
 *
 * Mise se automaticky dekomponují na konkrétní úkoly podle typu.
 */
import { AgentEntityImpl, type AgentEntityDeps } from "../agent.js";
import type { AgentDefinition, AgentTask, AgentStatus, LiveWorkExplanation } from "@milo/shared";

export interface ExecutiveAgentState {
  department: string;
  activeMissionId?: string;
  activeTask?: AgentTask;
  missionLog: Array<{
    missionId: string;
    title: string;
    startedAt: string;
    completedAt?: string;
    status: "running" | "completed" | "failed";
    result?: string;
  }>;
}

/** Mapa oddělení → výchozí capability */
const DEPARTMENT_CAPABILITIES: Record<string, string[]> = {
  "Office of the Chief": ["executive:brief", "executive:mission", "executive:projects", "executive:system"],
  "ARCH": ["executive:system", "executive:audit", "executive:search"],
  "ENG": ["executive:docker", "executive:system", "executive:costs"],
  "KNOW": ["executive:search", "executive:system", "executive:audit"],
  "COMM": ["executive:brief", "executive:search", "executive:system"],
  "OPS": ["executive:docker", "executive:costs", "executive:system", "executive:audit"],
  "QA": ["executive:audit", "executive:system", "executive:search"],
};

export class ExecutiveAgent extends AgentEntityImpl {
  private execState: ExecutiveAgentState;

  constructor(
    definition: AgentDefinition,
    deps: AgentEntityDeps,
    department: string,
  ) {
    super(definition, deps);
    this.execState = {
      department,
      missionLog: [],
    };
  }

  get department(): string {
    return this.execState.department;
  }

  get activeMissionId(): string | undefined {
    return this.execState.activeMissionId;
  }

  get capabilities(): string[] {
    return DEPARTMENT_CAPABILITIES[this.execState.department] ?? ["executive:system"];
  }

  /** Přijme a spustí misi */
  async acceptMission(mission: { id: string; title: string; description?: string }): Promise<void> {
    this.execState.activeMissionId = mission.id;
    this.execState.missionLog.push({
      missionId: mission.id,
      title: mission.title,
      startedAt: new Date().toISOString(),
      status: "running",
    });

    await this.transitionTo("working");

    this.setExplanation({
      currentActivity: `Přijímám misi: ${mission.title}`,
      goal: mission.description ?? "Dokončit misi",
      reason: `Mise přiřazena oddělení ${this.execState.department}`,
      findings: "Mise zahájena.",
      evidence: [`Oddělení: ${this.execState.department}`, `Capability: ${this.capabilities.join(", ")}`],
      toolsUsed: this.capabilities.slice(0, 5),
      nextStep: "Dekomponuji misi na úkoly",
      estimatedCompletion: "Dle složitosti mise (1-5 minut)",
      risks: "Nízké — všechny komponenty jsou lokální",
      needsFromUser: "Nic",
      lastCompletedStep: "Přijetí mise",
      confidence: "vysoká",
      alternativeApproach: "Žádný.",
    });

    // Vytvoř úkol pro misi
    const task: AgentTask = {
      id: `task-${mission.id}-${Date.now()}`,
      title: mission.title,
      description: mission.description ?? mission.title,
      type: "custom",
      status: "pending",
      priority: "normal",
      ownerId: mission.id,
      ownerType: "agent",
      source: "executive",
      log: [],
      toolsUsed: [],
      citations: [],
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await this.runTask(task);
  }

  /** Dokončí aktivní misi */
  completeMission(result?: string): void {
    const activeLog = this.execState.missionLog.find(
      (m) => m.missionId === this.execState.activeMissionId && m.status === "running"
    );
    if (activeLog) {
      activeLog.status = "completed";
      activeLog.completedAt = new Date().toISOString();
      activeLog.result = result;
    }
    this.execState.activeMissionId = undefined;
  }

  async start(): Promise<void> {
    await super.start();
    this.setExplanation({
      currentActivity: `Executive Agent ${this.agent.name} — ${this.execState.department}`,
      goal: `Připraven vykonávat úkoly v oddělení ${this.execState.department}`,
      reason: "Executive Agent je aktivní a čeká na úkoly.",
      findings: `Dostupné capability: ${this.capabilities.join(", ")}`,
      evidence: [`Oddělení: ${this.execState.department}`],
      toolsUsed: this.capabilities.slice(0, 8),
      nextStep: "Přijmout misi nebo úkol.",
      estimatedCompletion: "Neurčito",
      risks: "Žádné.",
      needsFromUser: "Přiřazení mise.",
      lastCompletedStep: "Inicializace",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });
  }

  /** Přetíží runTask — pro executive mise používá executive strategii */
  async runTask(task: AgentTask): Promise<void> {
    // Pro executive typy úkolů nastavíme správný typ
    if (!task.type || task.type === "custom") {
      const lower = (task.title + " " + (task.description ?? "")).toLowerCase();

      if (/briefing|brief|ranní/i.test(lower)) task.type = "executive:brief";
      else if (/docker|kontejner/i.test(lower)) task.type = "executive:docker";
      else if (/projekt|priorit/i.test(lower)) task.type = "executive:projects";
      else if (/náklad|cost|cena/i.test(lower)) task.type = "executive:costs";
      else if (/hledej|vyhledej|najdi|search/i.test(lower)) task.type = "executive:search";
      else if (/audit|kontrola/i.test(lower)) task.type = "executive:audit";
      else if (/systém|system|registry|stav/i.test(lower)) task.type = "executive:system";
      else if (/mise|mission/i.test(lower)) task.type = "executive:mission";
    }

    return super.runTask(task);
  }

  getMissionLog(): ExecutiveAgentState["missionLog"] {
    return [...this.execState.missionLog];
  }
}
