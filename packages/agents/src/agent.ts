import type {
  Agent,
  AgentDefinition,
  AgentLogEntry,
  AgentMemoryEntry,
  AgentMetrics,
  AgentMetricsSnapshot,
  AgentTask,
  AgentStatus,
  LiveWorkExplanation,
} from "@milo/shared";
import type {
  AgentEntity,
  AgentEventBus,
  AgentFrameworkEvent,
  AgentRuntimeState,
  TaskRunner,
} from "./types.js";

export interface AgentEntityDeps {
  eventBus: AgentEventBus;
  taskRunner: TaskRunner;
  log: (entry: Omit<AgentLogEntry, "id">) => Promise<AgentLogEntry>;
  memory: {
    upsert: (agentId: string, key: string, value: unknown) => Promise<AgentMemoryEntry>;
    findByKey: (agentId: string, key: string) => Promise<AgentMemoryEntry | null>;
  };
  metrics: {
    create: (snapshot: Omit<AgentMetricsSnapshot, "id">) => Promise<AgentMetricsSnapshot>;
  };
}

export class AgentEntityImpl implements AgentEntity {
  readonly agent: Agent;
  private status: AgentStatus = "idle";
  private activeTaskId?: string;
  private explanation: LiveWorkExplanation;
  private pendingTasks = 0;
  private runningTasks = 0;
  private completedTasks = 0;
  private failedTasks = 0;
  private stopped = false;

  constructor(
    definition: AgentDefinition,
    private deps: AgentEntityDeps,
  ) {
    const now = new Date().toISOString();
    this.agent = {
      ...definition,
      status: "idle",
      health: { status: "healthy", lastHeartbeat: now },
      metrics: emptyMetrics(now),
      memory: {},
      createdAt: now,
      updatedAt: now,
    };
    this.explanation = emptyExplanation();
  }

  get id(): string {
    return this.agent.id;
  }

  getState(): AgentRuntimeState {
    return {
      status: this.status,
      activeTaskId: this.activeTaskId,
      explanation: this.explanation,
      pendingTasks: this.pendingTasks,
      runningTasks: this.runningTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
    };
  }

  explain(): LiveWorkExplanation {
    return this.explanation;
  }

  async initialize(): Promise<void> {
    await this.emit("agent:registered", { agent: this.agent });
    await this.log("info", `Agent ${this.agent.name} initialized`);
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.status = "idle";
    await this.updateAgentStatus("idle");
    await this.log("info", `Agent ${this.agent.name} started`);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.status = "offline";
    await this.updateAgentStatus("offline");
    await this.log("info", `Agent ${this.agent.name} stopped`);
  }

  async pause(): Promise<void> {
    this.status = "paused";
    await this.updateAgentStatus("paused");
    await this.log("info", `Agent ${this.agent.name} paused`);
  }

  async resume(): Promise<void> {
    this.status = this.activeTaskId ? "working" : "idle";
    await this.updateAgentStatus(this.status);
    await this.log("info", `Agent ${this.agent.name} resumed`);
  }

  async runTask(task: AgentTask): Promise<void> {
    if (this.stopped) {
      throw new Error(`Agent ${this.id} is offline`);
    }
    this.activeTaskId = task.id;
    this.status = "working";
    this.runningTasks += 1;
    await this.updateAgentStatus("working");

    this.setExplanation({
      currentActivity: `Spouštím úkol: ${task.title}`,
      goal: task.description ?? "Dokončit zadaný úkol",
      reason: `Přijal jsem úkol od ${task.ownerType} ${task.ownerId}`,
      findings: "Zatím začínám.",
      evidence: ["interní fronta úkolů"],
      toolsUsed: this.agent.config.tools.slice(0, 3),
      nextStep: "Inicializovat kontext a spustit runner.",
      estimatedCompletion: "Za několik vteřin",
      risks: "Žádné známé riziko.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      decisionLog: [{ timestamp: new Date().toISOString(), thought: `Přijal jsem úkol ${task.id}` }],
    });

    await this.emit("agent:task:created", { taskId: task.id, title: task.title });

    try {
      await this.deps.taskRunner.execute(task, this.agent);
      this.completedTasks += 1;
      this.setExplanation({
        ...this.explanation,
        currentActivity: "Úkol dokončen.",
        findings: `Úkol ${task.title} byl úspěšně dokončen.`,
        lastCompletedStep: `Dokončil jsem úkol ${task.title}`,
      });
    } catch (error) {
      this.failedTasks += 1;
      this.setExplanation({
        ...this.explanation,
        currentActivity: "Úkol selhal.",
        findings: `Úkol ${task.title} selhal: ${error instanceof Error ? error.message : String(error)}`,
      });
      throw error;
    } finally {
      this.runningTasks = Math.max(0, this.runningTasks - 1);
      this.activeTaskId = undefined;
      this.status = "idle";
      await this.updateAgentStatus("idle");
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    await this.log("warn", `Task ${taskId} cancelled`);
    await this.emit("agent:task:cancelled", { taskId });
    if (this.activeTaskId === taskId) {
      this.activeTaskId = undefined;
      this.status = "idle";
      await this.updateAgentStatus("idle");
    }
  }

  async scheduleTask(task: AgentTask, when: string | number): Promise<void> {
    this.pendingTasks += 1;
    await this.log("info", `Task ${task.id} scheduled for ${String(when)}`);
    await this.emit("agent:task:created", { taskId: task.id, title: task.title, scheduledFor: when });
  }

  async retry(taskId: string): Promise<void> {
    await this.log("info", `Retrying task ${taskId}`);
    await this.emit("agent:task:started", { taskId, retry: true });
  }

  async heartbeat(): Promise<void> {
    const now = new Date().toISOString();
    this.agent.health.lastHeartbeat = now;
    await this.deps.metrics.create({ agentId: this.id, timestamp: now, metrics: this.agent.metrics });
    await this.emit("agent:heartbeat", { status: this.status });
  }

  async report(): Promise<Record<string, unknown>> {
    return {
      agentId: this.id,
      name: this.agent.name,
      status: this.status,
      metrics: this.agent.metrics,
      explanation: this.explanation,
    };
  }

  private setExplanation(partial: Partial<LiveWorkExplanation>): void {
    this.explanation = {
      ...this.explanation,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    void this.emit("agent:explanation", { explanation: this.explanation });
  }

  private async updateAgentStatus(status: AgentStatus): Promise<void> {
    this.status = status;
    this.agent.status = status;
    this.agent.updatedAt = new Date().toISOString();
    await this.emit("agent:status", { status });
  }

  private async emit(type: AgentFrameworkEvent["type"], payload: Record<string, unknown>): Promise<void> {
    await this.deps.eventBus.publish({
      type,
      agentId: this.id,
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  private async log(level: AgentLogEntry["level"], message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.deps.log({ agentId: this.id, timestamp: new Date().toISOString(), level, message, metadata });
  }
}

function emptyMetrics(now: string): AgentMetrics {
  return {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    retriedTasks: 0,
    averageDurationMs: 0,
    errorCount: 0,
    lastUpdatedAt: now,
  };
}

function emptyExplanation(): LiveWorkExplanation {
  const now = new Date().toISOString();
  return {
    currentActivity: "Čekám na úkol.",
    goal: "Být připraven přijmout a vykonat úkol.",
    reason: "Agent je inicializován a čeká na práci.",
    findings: "Zatím žádné výsledky.",
    evidence: [],
    toolsUsed: [],
    nextStep: "Čekat na přidělení úkolu.",
    estimatedCompletion: "Neurčito",
    risks: "Žádné.",
    needsFromUser: "Nic.",
    lastCompletedStep: "Inicializace",
    decisionLog: [],
    updatedAt: now,
  };
}
