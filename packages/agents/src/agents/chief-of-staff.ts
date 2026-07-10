import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import type { AgentDefinition, AgentTask } from "@milo/shared";

export interface ChiefOfStaffState {
  activeTask?: AgentTask;
  taskProgress: number;
  runningTimeMs: number;
  lastActivityAt?: string;
}

export class ChiefOfStaffAgent extends AgentEntityImpl {
  private state: ChiefOfStaffState = {
    taskProgress: 0,
    runningTimeMs: 0,
  };

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async start(): Promise<void> {
    await super.start();
    this.setExplanation({
      currentActivity: "Jsem připraven koordinovat agenty.",
      goal: "Přijímat zadání, vytvářet mise a delegovat úkoly.",
      reason: "Chief of Staff čeká na instrukci od uživatele.",
      findings: "Žádná aktivní mise.",
      evidence: [],
      toolsUsed: this.agent.config.tools.slice(0, 5),
      nextStep: "Přijmout zadání a vytvořit Mission.",
      estimatedCompletion: "Neurčito",
      risks: "Žádné.",
      needsFromUser: "Zadání úkolu nebo otázka.",
      lastCompletedStep: "Inicializace",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });
  }

  getTaskProgress(): number {
    return this.state.taskProgress;
  }
}
