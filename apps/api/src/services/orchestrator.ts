/**
 * Orchestrator — rozšiřuje Chief of Staff o automatickou orchestraci:
 * 1. Přijme misi → dekomponuje na tasky
 * 2. Pro každý task: najde nejlepšího agenta přes TaskRouter
 * 3. Vytvoří task přes API → přiřadí agentovi
 * 4. Spravuje state machine: pending → assigned → in_progress → completed
 * 5. Monitoruje progress, řeší retry a fallback
 */
import type { AgentTask, AgentSpec } from "@milo/shared";
import { getTaskRouter, type TaskRoutingInput } from "./task-router.js";
import type { ControlCenterStore } from "../modules/control-center/store.js";

// ─── State Machine ─────────────────────────────────────────────

export type OrchestrationTaskStatus =
  | "pending"      // Nový task, ještě nepřiřazen
  | "assigned"     // Přiřazen agentovi, čeká na start
  | "in_progress"  // Agent na tom pracuje
  | "review"       // Agent dokončil, čeká na schválení CoS
  | "completed"    // CoS schválil — hotovo
  | "failed"       // Selhalo (po retries)
  | "cancelled";   // Zrušeno

export interface OrchestrationTask {
  id: string;
  title: string;
  description?: string;
  type?: string;
  category?: string;
  priority: string;
  requiredCapabilities?: string[];
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: OrchestrationTaskStatus;
  score?: number;
  matchReasons?: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export interface MissionInput {
  title: string;
  description: string;
  priority?: string;
  tasks: {
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    requiredCapabilities?: string[];
  }[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  tasks: OrchestrationTask[];
  createdAt: string;
  completedAt?: string;
  stats: {
    total: number;
    pending: number;
    assigned: number;
    in_progress: number;
    review: number;
    completed: number;
    failed: number;
  };
}

// ─── Validní přechody ─────────────────────────────────────────

const VALID_TRANSITIONS: Record<OrchestrationTaskStatus, OrchestrationTaskStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled", "failed"],
  in_progress: ["review", "failed", "cancelled"],
  review: ["completed", "failed", "in_progress"],
  completed: [],
  failed: ["pending", "assigned"],
  cancelled: [],
};

// ─── Orchestrator ──────────────────────────────────────────────

export class Orchestrator {
  private missions: Map<string, Mission> = new Map();
  private taskRouter = getTaskRouter();
  private store: ControlCenterStore;
  private delegateTask: (task: Omit<AgentTask, "id" | "createdAt">) => Promise<AgentTask>;
  private updateApiTask: (id: string, update: Partial<AgentTask>) => Promise<AgentTask>;
  private completeApiTask: (id: string, result?: string) => Promise<AgentTask>;

  constructor(deps: {
    store: ControlCenterStore;
    delegateTask: (task: Omit<AgentTask, "id" | "createdAt">) => Promise<AgentTask>;
    updateTask: (id: string, update: Partial<AgentTask>) => Promise<AgentTask>;
    completeTask: (id: string, result?: string) => Promise<AgentTask>;
  }) {
    this.store = deps.store;
    this.delegateTask = deps.delegateTask;
    this.updateApiTask = deps.updateTask;
    this.completeApiTask = deps.completeTask;
  }

  /**
   * Aktualizuje interní data TaskRouteru z control-center store.
   */
  syncAgents(): void {
    const agents = this.store.getAgents();
    this.taskRouter.updateAgents(
      agents,
      (agentId) => this.store.getAgentCapabilities(agentId),
      (agentId) => {
        // Počítáme aktivní tasky pro daného agenta
        const devTasks = this.store.getDevTasks({ agentId, status: "in_progress" });
        return devTasks.length;
      },
    );
  }

  /**
   * Vytvoří novou misi — dekomponuje na tasky, přiřadí agenty.
   */
  async createMission(input: MissionInput): Promise<Mission> {
    this.syncAgents();

    const missionId = `m-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const orchestrationTasks: OrchestrationTask[] = [];

    for (const taskInput of input.tasks) {
      const routingInput: TaskRoutingInput = {
        title: taskInput.title,
        description: taskInput.description,
        type: taskInput.type,
        priority: taskInput.priority ?? input.priority ?? "normal",
        requiredCapabilities: taskInput.requiredCapabilities,
      };

      const best = this.taskRouter.findBest(routingInput);

      const oTask: OrchestrationTask = {
        id: `ot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: taskInput.title,
        description: taskInput.description,
        type: taskInput.type,
        priority: taskInput.priority ?? input.priority ?? "normal",
        requiredCapabilities: taskInput.requiredCapabilities,
        assignedAgentId: best?.agent.id,
        assignedAgentName: best?.agent.name,
        status: best ? "assigned" : "pending",
        score: best?.score,
        matchReasons: best?.matchReasons,
        createdAt: now,
        retryCount: 0,
        maxRetries: 3,
      };

      orchestrationTasks.push(oTask);

      // Vytvoř task v API
      if (best) {
        try {
          await this.delegateTask({
            title: taskInput.title,
            description: taskInput.description,
            type: (taskInput.type as AgentTask["type"]) ?? "custom",
            priority: (taskInput.priority ?? input.priority ?? "normal") as AgentTask["priority"],
            ownerId: best.agent.id,
            ownerType: "agent",
            source: "orchestrator",
            missionId,
            status: "pending",
            log: [],
            toolsUsed: [],
            citations: [],
            retryCount: 0,
          });
        } catch (err) {
          oTask.status = "failed";
          oTask.error = String(err);
        }
      }
    }

    const stats = this.computeStats(orchestrationTasks);

    const mission: Mission = {
      id: missionId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "normal",
      status: orchestrationTasks.every((t) => t.status === "failed") ? "failed" : "in_progress",
      tasks: orchestrationTasks,
      createdAt: now,
      stats,
    };

    this.missions.set(missionId, mission);
    return mission;
  }

  /**
   * Posune stav tasku na další fázi.
   */
  async advanceTask(
    missionId: string,
    taskId: string,
    newStatus: OrchestrationTaskStatus,
    result?: string,
  ): Promise<OrchestrationTask | null> {
    const mission = this.missions.get(missionId);
    if (!mission) return null;

    const task = mission.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    // Validace přechodu
    const allowed = VALID_TRANSITIONS[task.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Neplatný přechod: ${task.status} → ${newStatus}. Povolené: ${allowed.join(", ")}`,
      );
    }

    const now = new Date().toISOString();
    task.status = newStatus;

    if (newStatus === "in_progress") task.startedAt = now;
    if (newStatus === "completed") task.completedAt = now;

    // Synchronizace s API taskem
    const apiTaskId = task.id.replace("ot-", "");
    try {
      if (newStatus === "in_progress") {
        await this.updateApiTask(apiTaskId, { status: "running" });
      } else if (newStatus === "completed") {
        await this.completeApiTask(apiTaskId, result);
      } else if (newStatus === "failed") {
        await this.updateApiTask(apiTaskId, { status: "failed" });
      }
    } catch (err) {
      // API nemusí mít task (např. při testech) — ignorujeme
    }

    // Pokud selhal → retry logika
    if (newStatus === "failed" && task.retryCount < task.maxRetries) {
      task.retryCount++;
      task.status = "pending";
      // Zkusíme znovu najít agenta
      this.syncAgents();
      const retryInput: TaskRoutingInput = {
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        requiredCapabilities: task.requiredCapabilities,
      };
      const best = this.taskRouter.findBest(retryInput);
      if (best) {
        task.assignedAgentId = best.agent.id;
        task.assignedAgentName = best.agent.name;
        task.score = best.score;
        task.matchReasons = best.matchReasons;
        task.status = "assigned";
      }
    }

    // Aktualizace statistik mise
    mission.stats = this.computeStats(mission.tasks);

    // Kontrola dokončení mise
    if (mission.stats.completed + mission.stats.failed === mission.stats.total) {
      mission.status = mission.stats.failed > 0 ? "failed" : "completed";
      mission.completedAt = now;
    }

    return task;
  }

  /**
   * Ručně přiřadí agenta k tasku.
   */
  assignAgent(missionId: string, taskId: string, agentId: string): OrchestrationTask | null {
    const mission = this.missions.get(missionId);
    if (!mission) return null;
    const task = mission.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const agents = this.store.getAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return null;

    task.assignedAgentId = agent.id;
    task.assignedAgentName = agent.name;
    task.status = "assigned";
    return task;
  }

  getMission(id: string): Mission | null {
    return this.missions.get(id) ?? null;
  }

  listMissions(): Mission[] {
    return Array.from(this.missions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  private computeStats(tasks: OrchestrationTask[]): Mission["stats"] {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      assigned: tasks.filter((t) => t.status === "assigned").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      failed: tasks.filter((t) => t.status === "failed").length,
    };
  }
}

// Singleton
let orchestrator: Orchestrator | null = null;
export function getOrchestrator(deps?: ConstructorParameters<typeof Orchestrator>[0]): Orchestrator {
  if (!orchestrator && deps) {
    orchestrator = new Orchestrator(deps);
  }
  if (!orchestrator) throw new Error("Orchestrator not initialized — call with deps first");
  return orchestrator;
}
