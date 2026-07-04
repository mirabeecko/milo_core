import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import type { AgentDefinition, AgentTask } from "@milo/shared";

export class ResearchAgent extends AgentEntityImpl {
  private taskHistory: AgentTask[] = [];
  private pendingQueue: AgentTask[] = [];

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async start(): Promise<void> {
    await super.start();
    this.setExplanation({
      currentActivity: "Jsem připraven provést rešerši.",
      goal: "Vyhledávat a analyzovat informace z dostupných zdrojů.",
      reason: "Research Agent čeká na zadání od Chief of Staff nebo uživatele.",
      findings: "Žádné aktivní vyhledávání.",
      evidence: [],
      toolsUsed: this.agent.config.tools.slice(0, 5),
      nextStep: "Přijmout úkol a spustit vyhledávání.",
      estimatedCompletion: "Neurčito",
      risks: "Žádné.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Inicializace",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });
  }

  getTaskProgress(): number {
    return super.getTaskProgress();
  }

  getTaskHistory(): AgentTask[] {
    return this.taskHistory;
  }

  getPendingQueue(): AgentTask[] {
    return this.pendingQueue;
  }
}
