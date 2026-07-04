import type { AgentMemory } from "./memory/index.js";
import type {
  Agent,
  AgentDefinition,
  AgentRuntimeConfig,
  AgentStatus,
  AgentTask,
  LiveWorkExplanation,
  TaskLogEntry,
} from "@milo/shared";

export interface AgentFrameworkConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  useBullMq?: boolean;
  defaultModel?: string;
  defaultTemperature?: number;
  runtime?: Partial<AgentRuntimeConfig>;
}

export interface TaskRunnerCallbacks {
  onProgress?: (progress: number) => void;
  onLog?: (entry: TaskLogEntry) => void;
  onExplanation?: (explanation: Partial<LiveWorkExplanation>) => void;
}

export interface TaskJob {
  id: string;
  taskId: string;
  agentId?: string;
  type: string;
  data: Record<string, unknown>;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface TaskQueue {
  add(job: Omit<TaskJob, "id" | "status" | "progress" | "createdAt">): Promise<TaskJob>;
  getJob(id: string): Promise<TaskJob | null>;
  updateProgress(id: string, progress: number): Promise<void>;
  complete(id: string, result?: Record<string, unknown>): Promise<void>;
  fail(id: string, error: string): Promise<void>;
  getWaiting(agentId?: string): Promise<TaskJob[]>;
  getActive(agentId?: string): Promise<TaskJob[]>;
  getCompleted(agentId?: string): Promise<TaskJob[]>;
  getFailed(agentId?: string): Promise<TaskJob[]>;
  close(): Promise<void>;
}

export interface TaskRunner {
  execute(task: AgentTask, agent: Agent, callbacks?: TaskRunnerCallbacks): Promise<Record<string, unknown>>;
}

export interface AgentEventBus {
  publish(event: AgentFrameworkEvent): Promise<void>;
  subscribe(handler: (event: AgentFrameworkEvent) => void | Promise<void>): () => void;
}

export interface AgentFrameworkEvent {
  type:
    | "agent:registered"
    | "agent:status"
    | "agent:heartbeat"
    | "agent:log"
    | "agent:explanation"
    | "agent:task:created"
    | "agent:task:started"
    | "agent:task:completed"
    | "agent:task:failed"
    | "agent:task:cancelled"
    | "agent:task:delegated"
    | "agent:mission:completed"
    | "agent:mission:failed"
    | "agent:error";
  agentId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface AgentRuntimeState {
  status: AgentStatus;
  activeTaskId?: string;
  taskProgress: number;
  explanation: LiveWorkExplanation;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTimeMs: number;
  lastActivityAt?: string;
}

export interface AgentRegistryEntry {
  definition: AgentDefinition;
  factory: () => AgentEntity;
}

export interface AgentEntity {
  readonly id: string;
  readonly agent: Agent;
  getState(): AgentRuntimeState;
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  restart(): Promise<void>;
  runTask(task: AgentTask): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  scheduleTask(task: AgentTask, when: string | number): Promise<void>;
  retry(taskId: string): Promise<void>;
  executeTool<TInput, TOutput>(toolId: string, input: TInput): Promise<TOutput>;
  heartbeat(): Promise<void>;
  report(): Promise<Record<string, unknown>>;
  explain(): LiveWorkExplanation;
  getMemory(): AgentMemory;
  getTaskHistory(): AgentTask[];
  getPendingQueue(): AgentTask[];
}
