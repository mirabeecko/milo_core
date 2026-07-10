import type {
  AgentDefinition,
  AgentLogEntry,
  AgentMemoryEntry,
  AgentMetricsSnapshot,
  AgentRuntimeConfig,
  AgentTask,
  CreateMissionInput,
  LiveWorkExplanation,
  Mission,
} from "@milo/shared";
import type {
  AgentEventRepository,
  AgentLogRepository,
  AgentMemoryRepository,
  AgentMetricsRepository,
  AgentRepository,
  MissionRepository,
  TaskRepository,
} from "@milo/database";
import { AgentEntityImpl, DEFAULT_RUNTIME_CONFIG } from "./agent.js";
import { createDefaultToolRegistry, type ToolRegistry } from "@milo/tools";
import { AgentMemoryImpl, RepositoryMemoryStorage } from "./memory/index.js";
import type { AgentEntityDeps } from "./agent.js";
import { InMemoryAgentEventBus } from "./event-bus.js";
import { InMemoryTaskQueue } from "./task-queue.js";
import { ExecutionTaskRunner } from "./runtime/execution-task-runner.js";
import { AgentScheduler } from "./runtime/agent-scheduler.js";
import { BackgroundRunner } from "./runtime/background-runner.js";
import { HealthMonitor } from "./runtime/health-monitor.js";
import { PriorityTaskQueue } from "./runtime/task-queue-v2.js";
import type {
  AgentEntity,
  AgentEventBus,
  AgentFrameworkConfig,
  AgentFrameworkEvent,
  GoogleAuthDeps,
  TaskQueue,
} from "./types.js";

export interface AgentManagerDeps {
  repositories: {
    agents: AgentRepository;
    tasks: TaskRepository;
    missions: MissionRepository;
    logs: AgentLogRepository;
    memory: AgentMemoryRepository;
    metrics: AgentMetricsRepository;
    events: AgentEventRepository;
  };
  eventBus?: AgentEventBus;
  queue?: TaskQueue;
  config?: AgentFrameworkConfig;
  vaultPath?: string;
  projectPath?: string;
  googleAuth?: GoogleAuthDeps;
}

export class AgentManager {
  private agents = new Map<string, AgentEntity>();
  private definitions = new Map<string, AgentDefinition>();
  private eventBus: AgentEventBus;
  private queue: TaskQueue;
  private scheduler: AgentScheduler;
  private backgroundRunner: BackgroundRunner;
  private healthMonitor: HealthMonitor;
  private priorityQueue: PriorityTaskQueue;
  private runtimeConfig: AgentRuntimeConfig;
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private deadlineInterval?: ReturnType<typeof setInterval>;

  private toolRegistry: ToolRegistry;

  constructor(private deps: AgentManagerDeps) {
    this.eventBus = deps.eventBus ?? new InMemoryAgentEventBus();
    this.toolRegistry = createDefaultToolRegistry();
    this.queue = deps.queue ?? new InMemoryTaskQueue();
    this.scheduler = new AgentScheduler();
    this.backgroundRunner = new BackgroundRunner();
    this.priorityQueue = new PriorityTaskQueue();
    this.runtimeConfig = { ...DEFAULT_RUNTIME_CONFIG, ...deps.config?.runtime };
    this.healthMonitor = new HealthMonitor({
      healthThresholdMs: this.runtimeConfig.healthThresholdMs,
      maxConsecutiveErrors: this.runtimeConfig.maxConsecutiveErrors,
    });
    this.eventBus.subscribe(async (event) => {
      await this.persistEvent(event);
    });
    this.eventBus.subscribe(async (event) => {
      await this.handleMissionLifecycleEvent(event);
    });
  }

  getMissionRepository(): MissionRepository {
    return this.deps.repositories.missions;
  }

  getConfig(): AgentRuntimeConfig {
    return this.runtimeConfig;
  }

  async register(
    definition: AgentDefinition,
    factory?: (definition: AgentDefinition, deps: AgentEntityDeps) => AgentEntity,
  ): Promise<AgentEntity> {
    this.definitions.set(definition.id, definition);
    const taskRunner = new ExecutionTaskRunner({
      queue: this.queue,
      eventBus: this.eventBus,
      toolRegistry: this.toolRegistry,
      vaultPath: this.deps.vaultPath,
      projectPath: this.deps.projectPath,
    });
    const entityDeps: AgentEntityDeps = {
      eventBus: this.eventBus,
      taskRunner,
      log: (entry) => this.deps.repositories.logs.create(entry),
      memory: {
        upsert: (agentId, key, value) => this.deps.repositories.memory.upsert(agentId, key, value),
        findByKey: (agentId, key) => this.deps.repositories.memory.findByKey(agentId, key),
      },
      metrics: {
        create: (snapshot) => this.deps.repositories.metrics.create(snapshot),
      },
      tasks: {
        update: (id, partial) => this.deps.repositories.tasks.update(id, partial),
      },
      scheduler: this.scheduler,
      backgroundRunner: this.backgroundRunner,
      toolRegistry: this.toolRegistry,
      agentMemory: new AgentMemoryImpl(definition.id, new RepositoryMemoryStorage(this.deps.repositories.memory)),
      config: this.runtimeConfig,
      vaultPath: this.deps.vaultPath,
      projectPath: this.deps.projectPath,
      googleAuth: this.deps.googleAuth,
    };
    const entity = factory ? factory(definition, entityDeps) : new AgentEntityImpl(definition, entityDeps);
    await entity.initialize();
    await this.deps.repositories.agents.create(entity.agent);
    this.agents.set(entity.id, entity);
    return entity;
  }

  async unregister(agentId: string): Promise<void> {
    const entity = this.agents.get(agentId);
    if (entity) {
      await entity.stop();
      this.agents.delete(agentId);
    }
    this.definitions.delete(agentId);
    await this.deps.repositories.agents.delete(agentId);
  }

  getAgent(agentId: string): AgentEntity | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): AgentEntity[] {
    return Array.from(this.agents.values());
  }

  async start(agentId: string): Promise<void> {
    const entity = this.requireAgent(agentId);
    await entity.start();
  }

  async stop(agentId: string): Promise<void> {
    const entity = this.requireAgent(agentId);
    await entity.stop();
  }

  async pause(agentId: string): Promise<void> {
    const entity = this.requireAgent(agentId);
    await entity.pause();
  }

  async resume(agentId: string): Promise<void> {
    const entity = this.requireAgent(agentId);
    await entity.resume();
  }

  async restart(agentId: string): Promise<void> {
    const entity = this.requireAgent(agentId);
    await entity.restart();
  }

  async startAll(): Promise<void> {
    this.scheduler.start();
    this.startDeadlineChecker();
    const results = await Promise.allSettled(
      this.listAgents().map((agent) => agent.start()),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error(result.reason, "Agent failed to start");
      }
    }
    const allFailed = results.every((r) => r.status === "rejected");
    if (allFailed && results.length > 0) {
      throw new Error(`All ${results.length} agents failed to start`);
    }
    this.startHeartbeat(this.runtimeConfig.heartbeatIntervalMs);
  }

  async stopAll(): Promise<void> {
    this.stopHeartbeat();
    this.stopDeadlineChecker();
    this.scheduler.stop();
    await Promise.all(this.listAgents().map((agent) => agent.stop()));
  }

  async delegate(task: Omit<AgentTask, "id" | "createdAt">): Promise<AgentTask> {
    const full = await this.deps.repositories.tasks.create(task);
    if (full.ownerType === "user") {
      return full;
    }
    await this.runDelegatedTask(full);
    return full;
  }

  private async runDelegatedTask(full: AgentTask): Promise<void> {
    const entity = this.selectAgentForTask(full);
    if (!entity) {
      this.priorityQueue.enqueue(full, { priority: full.priority, maxRetries: this.runtimeConfig.maxRetries });
      throw new Error(`No suitable agent found for task ${full.title}`);
    }

    this.priorityQueue.enqueue(full, { priority: full.priority, maxRetries: this.runtimeConfig.maxRetries });
    await this.eventBus.publish({
      type: "agent:task:delegated",
      agentId: entity.id,
      timestamp: new Date().toISOString(),
      payload: { taskId: full.id, from: full.ownerId, to: entity.id },
    });

    const queued = this.priorityQueue.dequeue();
    if (queued) {
      entity.runTask(queued.task).catch(async (error) => {
        const message = error instanceof Error ? error.message : String(error);
        await this.deps.repositories.tasks.update(queued.task.id, { status: "failed" }).catch(() => undefined);
        await this.eventBus.publish({
          type: "agent:task:failed",
          agentId: entity.id,
          timestamp: new Date().toISOString(),
          payload: { taskId: queued.task.id, error: message },
        }).catch(() => undefined);
      });
    }
  }

  async createMission(input: CreateMissionInput): Promise<Mission> {
    const mission = await this.deps.repositories.missions.create({
      title: input.title,
      description: input.description,
      ownerId: "chief-of-staff",
      status: "pending",
      priority: input.priority ?? "normal",
    });

    const task = await this.deps.repositories.tasks.create({
      title: `Research: ${input.title}`,
      description: input.description,
      type: "search",
      priority: input.priority ?? "normal",
      status: "pending",
      ownerId: "research",
      ownerType: "agent",
      source: "chief-of-staff",
      missionId: mission.id,
      log: [],
      toolsUsed: ["obsidian", "web-search"],
      citations: [],
      retryCount: 0,
      estimateMs: 60_000,
    });

    await this.deps.repositories.missions.update(mission.id, {
      status: "running",
      startedAt: new Date().toISOString(),
    });

    try {
      await this.runDelegatedTask(task);
    } catch {
      // Task is enqueued, will run when a matching agent comes online.
    }

    const updated = await this.deps.repositories.missions.findById(mission.id);
    if (!updated) {
      throw new Error(`Mission ${mission.id} was lost after creation`);
    }
    return updated;
  }

  async schedule(task: Omit<AgentTask, "id" | "createdAt">, when: string | number): Promise<AgentTask> {
    const full = await this.deps.repositories.tasks.create(task);
    const entity = this.selectAgentForTask(full);
    if (!entity) {
      throw new Error(`No suitable agent found for task ${full.title}`);
    }
    await entity.scheduleTask(full, when);
    return full;
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = await this.deps.repositories.tasks.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    this.priorityQueue.cancel(taskId);
    const entity = this.agents.get(task.ownerId);
    if (entity) {
      await entity.cancelTask(taskId);
    }
    await this.deps.repositories.tasks.update(taskId, { status: "cancelled" });
  }

  async retry(taskId: string): Promise<void> {
    const task = await this.deps.repositories.tasks.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    const entity = this.agents.get(task.ownerId);
    if (!entity) {
      throw new Error(`Agent ${task.ownerId} not found`);
    }
    const requeued = this.priorityQueue.retry(taskId);
    if (!requeued) {
      // If not in priority queue anymore, enqueue again
      this.priorityQueue.enqueue(task, { priority: task.priority, maxRetries: this.runtimeConfig.maxRetries });
    }
    await entity.retry(taskId);
    const queued = this.priorityQueue.dequeue();
    if (queued) {
      void entity.runTask(queued.task);
    }
  }

  async heartbeat(): Promise<void> {
    await Promise.all(
      this.listAgents().map(async (agent) => {
        await agent.heartbeat();
        this.healthMonitor.heartbeat(agent.id);
        agent.agent.health = this.healthMonitor.check(agent.id);
      }),
    );
  }

  startHeartbeat(intervalMs = this.runtimeConfig.heartbeatIntervalMs): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      void this.heartbeat();
    }, intervalMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  startDeadlineChecker(intervalMs = 5000): void {
    this.stopDeadlineChecker();
    this.deadlineInterval = setInterval(() => {
      this.priorityQueue.checkDeadlines();
    }, intervalMs);
  }

  stopDeadlineChecker(): void {
    if (this.deadlineInterval) {
      clearInterval(this.deadlineInterval);
      this.deadlineInterval = undefined;
    }
  }

  async getExplanation(agentId: string): Promise<LiveWorkExplanation> {
    const entity = this.requireAgent(agentId);
    return entity.explain();
  }

  async getLogs(agentId: string, limit?: number): Promise<AgentLogEntry[]> {
    return this.deps.repositories.logs.findByAgentId(agentId, { limit });
  }

  async getMetrics(agentId: string, limit?: number): Promise<AgentMetricsSnapshot[]> {
    return this.deps.repositories.metrics.findByAgentId(agentId, { limit });
  }

  async getMemory(agentId: string): Promise<AgentMemoryEntry[]> {
    return this.deps.repositories.memory.findByAgentId(agentId);
  }

  async getTasks(options?: {
    status?: string;
    ownerId?: string;
    missionId?: string;
    limit?: number;
  }): Promise<AgentTask[]> {
    return this.deps.repositories.tasks.findAll(options);
  }

  async getMissions(options?: { status?: string; limit?: number }): Promise<Mission[]> {
    return this.deps.repositories.missions.findAll(options);
  }

  async getMissionById(id: string): Promise<Mission | null> {
    return this.deps.repositories.missions.findById(id);
  }

  getPriorityQueue(): PriorityTaskQueue {
    return this.priorityQueue;
  }

  async getEvents(options?: { limit?: number; type?: AgentFrameworkEvent["type"] }): Promise<AgentFrameworkEvent[]> {
    const events = await this.deps.repositories.events.findAll(options);
    return events.map((e) => ({
      type: e.type as AgentFrameworkEvent["type"],
      agentId: e.agentId,
      timestamp: e.timestamp,
      payload: e.payload,
    }));
  }

  subscribe(handler: (event: AgentFrameworkEvent) => void | Promise<void>): () => void {
    return this.eventBus.subscribe(handler);
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  async executeTool<TInput, TOutput>(agentId: string, toolId: string, input: TInput): Promise<TOutput> {
    const agent = this.requireAgent(agentId);
    const allowed = agent.agent.config.tools.some((t) => toolId === t || toolId.startsWith(`${t}:`));
    if (!allowed) {
      throw new Error(`Agent ${agentId} does not have permission to use tool ${toolId}`);
    }
    return agent.executeTool<TInput, TOutput>(toolId, input);
  }

  async close(): Promise<void> {
    this.stopHeartbeat();
    this.stopDeadlineChecker();
    this.scheduler.stop();
    await this.stopAll();
    await this.queue.close();
  }

  private requireAgent(agentId: string): AgentEntity {
    const entity = this.agents.get(agentId);
    if (!entity) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return entity;
  }

  private selectAgentForTask(task: AgentTask): AgentEntity | undefined {
    if (task.ownerType === "agent" && this.agents.has(task.ownerId)) {
      const entity = this.agents.get(task.ownerId);
      if (entity && entity.agent.status !== "offline" && entity.agent.status !== "error") {
        return entity;
      }
    }

    const candidates = this.listAgents().filter((a) => a.agent.status !== "offline" && a.agent.status !== "error");

    // Match by tool capability
    if (task.toolsUsed.length > 0) {
      const capable = candidates.filter((a) => task.toolsUsed.some((tool) => a.agent.config.tools.includes(tool)));
      if (capable.length > 0) {
        return capable[0];
      }
    }

    return candidates[0];
  }

  private async handleMissionLifecycleEvent(event: AgentFrameworkEvent): Promise<void> {
    if (event.type === "agent:task:completed") {
      const taskId = typeof event.payload.taskId === "string" ? event.payload.taskId : undefined;
      if (!taskId) return;
      const task = await this.deps.repositories.tasks.findById(taskId);
      if (!task?.missionId) return;
      const mission = await this.deps.repositories.missions.findById(task.missionId);
      if (!mission) return;
      const result = task.result ?? { output: "Úkol dokončen bez výstupu." };
      await this.deps.repositories.missions.update(mission.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        result,
      });
      await this.eventBus.publish({
        type: "agent:mission:completed",
        agentId: "chief-of-staff",
        timestamp: new Date().toISOString(),
        payload: { missionId: mission.id, taskId, result },
      }).catch(() => undefined);
      return;
    }

    if (event.type === "agent:task:failed") {
      const taskId = typeof event.payload.taskId === "string" ? event.payload.taskId : undefined;
      if (!taskId) return;
      const task = await this.deps.repositories.tasks.findById(taskId);
      if (!task?.missionId) return;
      const mission = await this.deps.repositories.missions.findById(task.missionId);
      if (!mission) return;
      await this.deps.repositories.missions.update(mission.id, {
        status: "failed",
        completedAt: new Date().toISOString(),
        result: { error: typeof event.payload.error === "string" ? event.payload.error : "Neznámá chyba" },
      });
      await this.eventBus.publish({
        type: "agent:mission:failed",
        agentId: "chief-of-staff",
        timestamp: new Date().toISOString(),
        payload: { missionId: mission.id, taskId, error: event.payload.error },
      }).catch(() => undefined);
    }
  }

  private async persistEvent(event: AgentFrameworkEvent): Promise<void> {
    await this.deps.repositories.events.create({
      type: event.type,
      agentId: event.agentId,
      timestamp: event.timestamp,
      payload: event.payload,
    });
  }
}
