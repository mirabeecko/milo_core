/**
 * Executive Agent — generická implementace pro všech 7 Executive Agentů.
 * Rozšiřuje AgentEntityImpl. Každý Executive Agent sdílí tuto třídu,
 * liší se pouze definicí (system prompt, nástroje, oprávnění).
 */
import { AgentEntityImpl, type AgentEntityDeps } from "../agent.js";
import type { AgentDefinition, AgentTask } from "@milo/shared";

export interface ExecutiveAgentState {
  department: string;
  activeMissionId?: string;
  activeTask?: AgentTask;
}

export class ExecutiveAgent extends AgentEntityImpl {
  private execState: ExecutiveAgentState;

  constructor(
    definition: AgentDefinition,
    deps: AgentEntityDeps,
    department: string,
  ) {
    super(definition, deps);
    this.execState = { department };
  }

  get department(): string {
    return this.execState.department;
  }

  get activeMissionId(): string | undefined {
    return this.execState.activeMissionId;
  }

  async start(): Promise<void> {
    await super.start();
    this.setExplanation({
      currentActivity: `Executive Agent ${this.agent.name} — ${this.execState.department}`,
      goal: `Plnit mise v rámci oddělení ${this.execState.department}`,
      reason: "Executive Agent čeká na přiřazení mise.",
      findings: "Žádná aktivní mise.",
      evidence: [],
      toolsUsed: this.agent.config.tools.slice(0, 8),
      nextStep: "Přijmout misi od Chiefa.",
      estimatedCompletion: "Neurčito",
      risks: "Žádné.",
      needsFromUser: "Přiřazení mise.",
      lastCompletedStep: "Inicializace",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });
  }
}
