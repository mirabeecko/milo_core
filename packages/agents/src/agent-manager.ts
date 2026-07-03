import type {
  AgentDefinition,
  AgentLogEntry,
  AgentMemoryEntry,
  AgentMetricsSnapshot,
  AgentTask,
  LiveWorkExplanation,
} from "@milo/shared";
import type {
  AgentEventRepository,
  AgentLogRepository,
  AgentMemoryRepository,
  AgentMetricsRepository,
  AgentRepository,
  TaskRepository,
} from "@milo/database";
import { AgentEntityImpl } from "./agent.js";
import type { AgentEntityDeps } from "./agent.js";
import { InMemoryAgentEventBus } from "./event-bus.js";
import { InMemoryTaskQueue } from "./task-queue.js";
import { DefaultTaskRunner } from "./task-runner.js";
import type { AgentEntity, AgentEventBus, AgentFrameworkConfig, AgentFrameworkEvent, TaskQueue } from "./types.js";

export interface AgentManagerDeps {
  repositories: {
    agents: AgentRepository;
    tasks: TaskRepository;
    logs: AgentLogRepository;
    memory: AgentMemoryRepository;
    metrics: AgentMetricsRepository;
    events: AgentEventRepository;
  };
  eventBus?: AgentEventBus;
  queue?: TaskQueue;
  config?: AgentFrameworkConfig;
}

export class AgentManager {
  private agents = new Map<string, AgentEntity>();
  private definitions = new Map<string, AgentDefinition>();
  private eventBus: AgentEventBus;
  private queue: TaskQueue;
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  constructor(private deps: AgentManagerDeps) {
    this.eventBus = deps.eventBus ?? new InMemoryAgentEventBus();
    this.queue = deps.queue ?? new InMemoryTaskQueue();
    this.eventBus.subscribe(async (event) => {
      await this.persistEvent(event);
    });
  }

  async register(
    definition: AgentDefinition,
    factory?: (definition: AgentDefinition, deps: AgentEntityDeps) => AgentEntity,
  ): Promise<AgentEntity> {
    this.definitions.set(definition.id, definition);
    const taskRunner = new DefaultTaskRunner({ queue: this.queue, eventBus: this.eventBus });
    const deps: AgentEntityDeps = {
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
    };
    const entity = factory ? factory(definition, deps) : new AgentEntityImpl(definition, deps);
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
    await entity.stop();
    await entity.start();
  }

  async startAll(): Promise<void> {
    await Promise.all(this.listAgents().map((agent) => agent.start()));
  }

  async stopAll(): Promise<void> {
    await Promise.all(this.listAgents().map((agent) => agent.stop()));
  }

  async delegate(task: Omit<AgentTask, "id" | "createdAt">): Promise<AgentTask> {
    const full = await this.deps.repositories.tasks.create(task);
    const entity = this.selectAgentForTask(full);
    if (!entity) {
      throw new Error(`No suitable agent found for task ${full.title}`);
    }
    await this.eventBus.publish({
      type: "agent:task:delegated",
      agentId: entity.id,
      timestamp: new Date().toISOString(),
      payload: { taskId: full.id, from: full.ownerId, to: entity.id },
    });
    void entity.runTask(full);
    return full;
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
    await entity.retry(taskId);
    void entity.runTask({ ...task, retryCount: task.retryCount + 1 });
  }

  async heartbeat(): Promise<void> {
    await Promise.all(this.listAgents().map((agent) => agent.heartbeat()));
  }

  startHeartbeat(intervalMs = 30000): void {
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
    limit?: number;
  }): Promise<AgentTask[]> {
    return this.deps.repositories.tasks.findAll(options);
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

  async close(): Promise<void> {
    this.stopHeartbeat();
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
      return this.agents.get(task.ownerId);
    }
    const candidates = this.listAgents().filter((a) => a.agent.status !== "offline" && a.agent.status !== "error");
    return candidates[0];
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
