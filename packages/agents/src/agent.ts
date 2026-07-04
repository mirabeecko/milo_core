import type { ToolRegistry } from "@milo/tools";
import type { AgentMemory } from "./memory/index.js";
import type {
  Agent,
  AgentDefinition,
  AgentLogEntry,
  AgentMemoryEntry,
  AgentMetrics,
  AgentMetricsSnapshot,
  AgentRuntimeConfig,
  AgentTask,
  AgentStatus,
  LiveWorkExplanation,
  TaskLogEntry,
  ToolCall,
} from "@milo/shared";
import type {
  AgentEntity,
  AgentEventBus,
  AgentFrameworkEvent,
  AgentRuntimeState,
  TaskRunner,
} from "./types.js";
import { AgentStateMachine } from "./runtime/agent-state-machine.js";
import type { AgentScheduler } from "./runtime/agent-scheduler.js";
import type { BackgroundRunner } from "./runtime/background-runner.js";

export interface AgentEntityDeps {
  eventBus: AgentEventBus;
  taskRunner: TaskRunner;
  toolRegistry: ToolRegistry;
  log: (entry: Omit<AgentLogEntry, "id">) => Promise<AgentLogEntry>;
  agentMemory: AgentMemory;
  memory: {
    upsert: (agentId: string, key: string, value: unknown) => Promise<AgentMemoryEntry>;
    findByKey: (agentId: string, key: string) => Promise<AgentMemoryEntry | null>;
  };
  metrics: {
    create: (snapshot: Omit<AgentMetricsSnapshot, "id">) => Promise<AgentMetricsSnapshot>;
  };
  tasks?: {
    update: (id: string, partial: Partial<AgentTask>) => Promise<AgentTask>;
  };
  scheduler?: AgentScheduler;
  backgroundRunner?: BackgroundRunner;
  config: AgentRuntimeConfig;
  vaultPath?: string;
  projectPath?: string;
}

export const DEFAULT_RUNTIME_CONFIG: AgentRuntimeConfig = {
  heartbeatIntervalMs: 30_000,
  taskTimeoutMs: 300_000,
  maxRetries: 2,
  retryBackoffMs: 1000,
  healthThresholdMs: 60_000,
  maxConsecutiveErrors: 3,
};

export class AgentEntityImpl implements AgentEntity {
  readonly agent: Agent;
  protected status: AgentStatus = "offline";
  protected activeTaskId?: string;
  protected explanation: LiveWorkExplanation;
  protected agentMemory: AgentMemory;
  protected pendingTasks = 0;
  protected runningTasks = 0;
  protected completedTasks = 0;
  protected failedTasks = 0;
  protected taskProgress = 0;
  protected startedAt?: string;
  protected lastActivityAt?: string;
  protected consecutiveErrors = 0;
  protected stopped = false;

  constructor(
    definition: AgentDefinition,
    protected deps: AgentEntityDeps,
  ) {
    const now = new Date().toISOString();
    this.agent = {
      ...definition,
      status: "offline",
      health: { status: "healthy", lastHeartbeat: now },
      metrics: emptyMetrics(now),
      memory: {},
      createdAt: now,
      updatedAt: now,
    };
    this.explanation = emptyExplanation();
    this.agentMemory = deps.agentMemory;
  }

  get id(): string {
    return this.agent.id;
  }

  getState(): AgentRuntimeState {
    return {
      status: this.status,
      activeTaskId: this.activeTaskId,
      taskProgress: this.getTaskProgress(),
      explanation: this.explanation,
      pendingTasks: this.pendingTasks,
      runningTasks: this.runningTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      runningTimeMs: this.getRunningTimeMs(),
      lastActivityAt: this.lastActivityAt,
    };
  }

  getRunningTimeMs(): number {
    if (!this.startedAt) return 0;
    return Date.now() - new Date(this.startedAt).getTime();
  }

  getTaskProgress(): number {
    return this.taskProgress;
  }

  getTaskHistory(): AgentTask[] {
    return [];
  }

  getPendingQueue(): AgentTask[] {
    return [];
  }

  explain(): LiveWorkExplanation {
    return this.explanation;
  }

  getMemory(): AgentMemory {
    return this.agentMemory;
  }

  async initialize(): Promise<void> {
    await this.emit("agent:registered", { agent: this.agent });
    await this.log("info", `Agent ${this.agent.name} initialized`);
  }

  async start(): Promise<void> {
    this.stopped = false;
    await this.transitionTo("starting");
    this.startedAt = new Date().toISOString();
    this.lastActivityAt = this.startedAt;
    this.consecutiveErrors = 0;
    await this.transitionTo("idle");
    await this.log("info", `Agent ${this.agent.name} started`);
  }

  async stop(): Promise<void> {
    if (this.status === "offline") {
      this.stopped = true;
      await this.log("info", `Agent ${this.agent.name} already offline`);
      return;
    }
    this.stopped = true;
    if (this.activeTaskId) {
      await this.cancelTask(this.activeTaskId);
    }
    await this.transitionTo("stopping");
    await this.transitionTo("offline");
    await this.log("info", `Agent ${this.agent.name} stopped`);
  }

  async pause(): Promise<void> {
    if (this.status === "paused") {
      await this.log("info", `Agent ${this.agent.name} already paused`);
      return;
    }
    if (!AgentStateMachine.isOperational(this.status) && this.status !== "idle") {
      throw new Error(`Cannot pause agent ${this.id} from status ${this.status}`);
    }
    await this.transitionTo("paused");
    await this.log("info", `Agent ${this.agent.name} paused`);
  }

  async resume(): Promise<void> {
    if (this.status !== "paused") {
      await this.log("info", `Agent ${this.agent.name} is not paused (status: ${this.status})`);
      return;
    }
    const nextStatus = this.activeTaskId ? "working" : "idle";
    await this.transitionTo(nextStatus);
    await this.log("info", `Agent ${this.agent.name} resumed`);
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
    await this.log("info", `Agent ${this.agent.name} restarted`);
  }

  async runTask(task: AgentTask): Promise<void> {
    if (AgentStateMachine.isTerminal(this.status)) {
      throw new Error(`Agent ${this.id} is ${this.status}`);
    }

    const startedAt = Date.now();
    this.activeTaskId = task.id;
    this.runningTasks += 1;
    this.taskProgress = 0;
    await this.transitionTo("working");

    this.agent.metrics.totalTasks += 1;

    await this.deps.tasks?.update(task.id, {
      status: "running",
      startedAt: new Date().toISOString(),
    });

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
      confidence: "100 %",
      alternativeApproach: "Žádný.",
      decisionLog: [{ timestamp: new Date().toISOString(), thought: `Přijal jsem úkol ${task.id}` }],
    });

    await this.emit("agent:task:created", { taskId: task.id, title: task.title });

    const callbacks = this.createTaskCallbacks(task);
    const execute = async () => this.deps.taskRunner.execute(task, this.agent, callbacks);

    const runner = this.deps.backgroundRunner;
    try {
      const result = runner
        ? await runner.run(task.id, execute, this.deps.config.taskTimeoutMs)
        : await execute();

      const completedAt = new Date().toISOString();
      const actualTimeMs = Date.now() - startedAt;
      const log = Array.isArray(result.log) ? (result.log as TaskLogEntry[]) : [];
      const toolCalls = Array.isArray(result.toolCalls) ? (result.toolCalls as ToolCall[]) : [];

      await this.deps.tasks?.update(task.id, {
        status: "completed",
        completedAt,
        actualTimeMs,
        result: {
          output: typeof result.output === "string" ? result.output : undefined,
          citations: Array.isArray(result.citations) ? (result.citations as string[]) : undefined,
          metadata: result.metadata as Record<string, unknown> | undefined,
        },
        log: [...task.log, ...log],
        toolCalls: [...(task.toolCalls ?? []), ...toolCalls],
      });

      this.completedTasks += 1;
      this.agent.metrics.successfulTasks += 1;
      this.updateAverageDuration(actualTimeMs);
      this.consecutiveErrors = 0;
      this.taskProgress = 100;
      this.setExplanation({
        ...this.explanation,
        currentActivity: "Úkol dokončen.",
        findings: `Úkol ${task.title} byl úspěšně dokončen.`,
        lastCompletedStep: `Dokončil jsem úkol ${task.title}`,
      });
      await this.emit("agent:task:completed", { taskId: task.id, title: task.title, result });
    } catch (error) {
      await this.handleTaskError(task, error, startedAt);
    } finally {
      this.runningTasks = Math.max(0, this.runningTasks - 1);
      this.activeTaskId = undefined;
      this.taskProgress = 0;
      if (this.status !== "paused" && this.status !== "error") {
        await this.transitionTo("idle");
      }
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    await this.log("warn", `Task ${taskId} cancelled`);
    this.deps.backgroundRunner?.cancel(taskId);
    if (this.activeTaskId === taskId) {
      this.activeTaskId = undefined;
      this.runningTasks = Math.max(0, this.runningTasks - 1);
      await this.transitionTo("idle");
    }
    await this.emit("agent:task:cancelled", { taskId });
  }

  async scheduleTask(task: AgentTask, when: string | number): Promise<void> {
    if (!this.deps.scheduler) {
      this.pendingTasks += 1;
      await this.log("info", `Task ${task.id} scheduled for ${String(when)} (no scheduler active)`);
      await this.emit("agent:task:created", { taskId: task.id, title: task.title, scheduledFor: when });
      return;
    }

    this.pendingTasks += 1;
    const whenMs = typeof when === "number" ? when : new Date(when).getTime();

    this.deps.scheduler.scheduleAt(whenMs, async () => {
      this.pendingTasks = Math.max(0, this.pendingTasks - 1);
      await this.runTask(task);
    });

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

  async executeTool<TInput, TOutput>(toolId: string, input: TInput): Promise<TOutput> {
    return this.deps.toolRegistry.execute<TInput, TOutput>(toolId, input, {
      userId: "system",
      traceId: `agent-${this.id}`,
      agentId: this.id,
      projectPath: this.deps.projectPath,
      vaultPath: this.deps.vaultPath,
    });
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

  protected async transitionTo(status: AgentStatus): Promise<void> {
    if (!AgentStateMachine.canTransition(this.status, status)) {
      throw new Error(`Invalid state transition: ${this.status} -> ${status}`);
    }
    this.status = status;
    this.agent.status = status;
    this.lastActivityAt = new Date().toISOString();
    this.agent.updatedAt = this.lastActivityAt;
    await this.emit("agent:status", { status });
  }

  protected async updateAgentStatus(status: AgentStatus): Promise<void> {
    await this.transitionTo(status);
  }

  protected setExplanation(partial: Partial<LiveWorkExplanation>): void {
    this.explanation = {
      ...this.explanation,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.lastActivityAt = this.explanation.updatedAt;
    void this.emit("agent:explanation", { explanation: this.explanation });
  }

  protected async emit(type: AgentFrameworkEvent["type"], payload: Record<string, unknown>): Promise<void> {
    await this.deps.eventBus.publish({
      type,
      agentId: this.id,
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  protected async log(level: AgentLogEntry["level"], message: string, metadata?: Record<string, unknown>): Promise<void> {
    this.lastActivityAt = new Date().toISOString();
    await this.deps.log({ agentId: this.id, timestamp: this.lastActivityAt, level, message, metadata });
  }

  private createTaskCallbacks(task: AgentTask) {
    return {
      onProgress: (progress: number) => {
        this.taskProgress = progress;
      },
      onLog: (entry: TaskLogEntry) => {
        void this.deps.tasks?.update(task.id, {
          log: [...task.log, entry],
        });
      },
      onExplanation: (partial: Partial<LiveWorkExplanation>) => {
        this.setExplanation(partial);
      },
    };
  }

  private updateAverageDuration(durationMs: number): void {
    const total = this.agent.metrics.successfulTasks + this.agent.metrics.failedTasks;
    const current = this.agent.metrics.averageDurationMs;
    this.agent.metrics.averageDurationMs =
      total <= 1 ? durationMs : Math.round((current * (total - 1) + durationMs) / total);
    this.agent.metrics.lastUpdatedAt = new Date().toISOString();
  }

  private async handleTaskError(task: AgentTask, error: unknown, startedAt?: number): Promise<void> {
    this.failedTasks += 1;
    this.agent.metrics.failedTasks += 1;
    this.agent.metrics.errorCount += 1;
    this.consecutiveErrors += 1;

    const message = error instanceof Error ? error.message : String(error);
    const actualTimeMs = startedAt ? Date.now() - startedAt : undefined;

    await this.deps.tasks?.update(task.id, {
      status: "failed",
      completedAt: new Date().toISOString(),
      actualTimeMs,
      result: {
        error: message,
      },
      log: [
        ...task.log,
        { timestamp: new Date().toISOString(), level: "error", message: `Úkol selhal: ${message}` },
      ],
    });

    this.setExplanation({
      ...this.explanation,
      currentActivity: "Úkol selhal.",
      findings: `Úkol ${task.title} selhal: ${message}`,
    });

    if (this.consecutiveErrors >= this.deps.config.maxConsecutiveErrors) {
      await this.transitionTo("error");
    }

    await this.emit("agent:task:failed", { taskId: task.id, error: message });
    throw error;
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
    confidence: "100 %",
    alternativeApproach: "Žádný.",
    decisionLog: [],
    updatedAt: now,
  };
}
