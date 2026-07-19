/**
 * MiLO Agent Graph — odlehčený orchestrátor agent workflow.
 *
 * Implementuje StateGraph pattern bez závislosti na LangGraph.
 * Každý agent je uzel v grafu. Graf řídí tok mezi uzly.
 *
 * Později lze vyměnit za LangGraph při zachování stejného rozhraní.
 */

import type { AgentStateData } from "./state.js";
import { addActivity } from "./state.js";

// ─── Types ───────────────────────────────────────────────────────────

/** Funkce, kterou implementuje každý uzel (agent) */
export type AgentNodeFn = (
  state: AgentStateData,
  signal?: AbortSignal,
) => Promise<Partial<AgentStateData>>;

/** Definice uzlu v grafu */
export interface AgentNodeDef {
  id: string;
  name: string;
  fn: AgentNodeFn;
  /** Kam jít po úspěchu */
  next?: string | ((state: AgentStateData) => string | null);
  /** Kam jít při chybě */
  onError?: string;
}

/** Výsledek běhu workflow */
export interface WorkflowResult {
  success: boolean;
  finalState: AgentStateData;
  error?: string;
  durationMs: number;
}

// ─── AgentGraph ──────────────────────────────────────────────────────

export class AgentGraph {
  private nodes = new Map<string, AgentNodeDef>();
  private entryNode: string | null = null;
  private abortControllers = new Map<string, AbortController>();

  /** Registrace uzlu */
  addNode(def: AgentNodeDef): this {
    this.nodes.set(def.id, def);
    return this;
  }

  /** Nastavení vstupního uzlu */
  setEntryPoint(nodeId: string): this {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Entry node '${nodeId}' not registered`);
    }
    this.entryNode = nodeId;
    return this;
  }

  /** Spuštění workflow */
  async run(
    initialState: AgentStateData,
  ): Promise<WorkflowResult> {
    const startTime = Date.now();

    if (!this.entryNode) {
      return {
        success: false,
        finalState: initialState,
        error: "No entry point set",
        durationMs: Date.now() - startTime,
      };
    }

    const abortController = new AbortController();
    this.abortControllers.set(initialState.runId, abortController);

    let state: AgentStateData = {
      ...initialState,
      status: "running",
    };

    let currentNodeId: string | null = this.entryNode;
    const visited = new Set<string>();
    const maxIterations = 50;

    try {
      for (let i = 0; i < maxIterations && currentNodeId; i++) {
        if (abortController.signal.aborted) {
          state = addActivity(state, {
            agentId: "orchestrator",
            agentName: "Orchestrator",
            type: "agent:completed",
            message: "Workflow zrušen",
          });
          state = { ...state, status: "completed" };
          break;
        }

        const node = this.nodes.get(currentNodeId);
        if (!node) {
          state = addActivity(state, {
            agentId: "orchestrator",
            agentName: "Orchestrator",
            type: "agent:error",
            message: `Neznámý uzel: ${currentNodeId}`,
          });
          break;
        }

        // Detekce smyčky
        if (visited.has(currentNodeId)) {
          state = addActivity(state, {
            agentId: "orchestrator",
            agentName: "Orchestrator",
            type: "agent:error",
            message: `Detekována smyčka na uzlu: ${currentNodeId}`,
          });
          break;
        }
        visited.add(currentNodeId);

        // Spuštění uzlu
        state = addActivity(state, {
          agentId: currentNodeId,
          agentName: node.name,
          type: "agent:started",
          message: `${node.name} začíná pracovat`,
        });

        try {
          const partial = await node.fn(state, abortController.signal);

          // Merge výsledku
          state = {
            ...state,
            ...partial,
            taskQueue: partial.taskQueue ?? state.taskQueue,
            completedTasks: partial.completedTasks ?? state.completedTasks,
            activityLog: partial.activityLog ?? state.activityLog,
            messages: partial.messages ?? state.messages,
            currentAgent: partial.currentAgent ?? state.currentAgent,
            status: partial.status ?? state.status,
            errorMessage: partial.errorMessage ?? state.errorMessage,
          };

          state = addActivity(state, {
            agentId: currentNodeId,
            agentName: node.name,
            type: "agent:completed",
            message: `${node.name} dokončil práci`,
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          state = addActivity(state, {
            agentId: currentNodeId,
            agentName: node.name,
            type: "agent:error",
            message: errorMsg,
            error: errorMsg,
          });
          state = { ...state, status: "error", errorMessage: errorMsg };

          // Přechod na chybový uzel
          if (node.onError && this.nodes.has(node.onError)) {
            currentNodeId = node.onError;
            continue;
          }
          break;
        }

        // Určení dalšího uzlu
        const nextNode = typeof node.next === "function" ? node.next(state) : (node.next ?? null);
        currentNodeId = nextNode;
      }
    } finally {
      this.abortControllers.delete(initialState.runId);
    }

    if (state.status === "running") {
      state = { ...state, status: "completed" };
    }

    return {
      success: state.status !== "error",
      finalState: state,
      error: state.errorMessage,
      durationMs: Date.now() - startTime,
    };
  }

  /** Zastavení běžícího workflow */
  abort(runId: string): void {
    const ctrl = this.abortControllers.get(runId);
    if (ctrl) {
      ctrl.abort();
      this.abortControllers.delete(runId);
    }
  }

  /** Výpis registrovaných uzlů */
  listNodes(): string[] {
    return Array.from(this.nodes.keys());
  }
}
