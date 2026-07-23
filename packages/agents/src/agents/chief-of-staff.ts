import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import type { AgentTask } from "@milo/shared";

export interface ChiefOfStaffState {
  activeMissions: {
    id: string;
    title: string;
    taskCount: number;
    completedCount: number;
    failedCount: number;
    status: string;
  }[];
  taskProgress: number;
  runningTimeMs: number;
  lastActivityAt?: string;
}

export class ChiefOfStaffAgent extends AgentEntityImpl {
  private state: ChiefOfStaffState = {
    activeMissions: [],
    taskProgress: 0,
    runningTimeMs: 0,
  };

  constructor(definition: any, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async start(): Promise<void> {
    await super.start();
    this.setExplanation({
      currentActivity: "Jsem připraven koordinovat agenty a orchestrovat mise.",
      goal: "Přijímat zadání, dekomponovat na tasky, přiřazovat agenty podle capabilities a sledovat průběh až do dokončení.",
      reason: "Chief of Staff čeká na instrukci od uživatele nebo systému.",
      findings: "TaskRouter + Orchestrator aktivní. 24+ agentů připraveno k přiřazování.",
      evidence: [
        "POST /orchestrate — vytvořit misi, dekomponovat, přiřadit agenty",
        "GET /orchestrate — seznam všech misí",
        "POST /orchestrate/:missionId/tasks/:taskId/advance — posunout stav tasku",
        "POST /orchestrate/preview — náhled routingu bez vytvoření",
      ],
      toolsUsed: ["orchestrator", "task-router", "calendar", "gmail", "obsidian"],
      nextStep: "Přijmout první misi přes POST /orchestrate.",
      estimatedCompletion: "Připraven",
      risks: "Někteří agenti offline — fallback na manuální přiřazení přes /assign.",
      needsFromUser: "Zadání mise k orchestraci.",
      lastCompletedStep: "Inicializace orchestrace a TaskRouteru",
      confidence: "95 %",
      alternativeApproach: "Manuální přiřazení přes /orchestrate/:missionId/tasks/:taskId/assign",
    });
  }

  /**
   * Synchronizuje stav s Orchestrátorem — voláno z API.
   */
  syncMissions(missions: {
    id: string;
    title: string;
    stats: { total: number; completed: number; failed: number };
    status: string;
  }[]): void {
    this.state.activeMissions = missions.map((m) => ({
      id: m.id,
      title: m.title,
      taskCount: m.stats.total,
      completedCount: m.stats.completed,
      failedCount: m.stats.failed,
      status: m.status,
    }));

    const totalCompleted = missions.reduce((sum, m) => sum + m.stats.completed, 0);
    const totalTasks = missions.reduce((sum, m) => sum + m.stats.total, 0);
    this.state.taskProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    this.state.lastActivityAt = new Date().toISOString();

    if (missions.length > 0) {
      const active = missions.filter((m) => m.status === "in_progress");
      this.setExplanation({
        currentActivity: active.length > 0
          ? `Řídím ${active.length} aktivních misí (${this.state.taskProgress}% hotovo)`
          : "Čekám na nové mise",
        goal: "Dokončit všechny přiřazené tasky.",
        reason: "Průběžná synchronizace stavu misí.",
        findings: `${missions.length} misí celkem, ${totalCompleted}/${totalTasks} tasků dokončeno.`,
        evidence: missions.map((m) => `${m.title}: ${m.stats.completed}/${m.stats.total} (${m.status})`),
        toolsUsed: ["orchestrator"],
        nextStep: this.state.taskProgress < 100
          ? "Pokračovat v monitorování a posouvání tasků."
          : "Všechny mise dokončeny — připraven na nové.",
        estimatedCompletion: this.state.taskProgress >= 100 ? "Hotovo" : "Probíhá",
        risks: missions.some((m) => m.stats.failed > 0)
          ? `${missions.filter((m) => m.stats.failed > 0).length} misí má chybové tasky.`
          : "Žádné.",
        needsFromUser: "",
        lastCompletedStep: `Sync ${missions.length} misí`,
        confidence: `${this.state.taskProgress} %`,
        alternativeApproach: "",
      });
    }
  }

  getTaskProgress(): number {
    return this.state.taskProgress;
  }

  getActiveMissions(): ChiefOfStaffState["activeMissions"] {
    return this.state.activeMissions;
  }
}
