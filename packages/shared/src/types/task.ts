export type TaskStatus =
  | "pending"
  | "queued"
  | "running"
  | "waiting"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type TaskPriority = "critical" | "high" | "normal" | "low";

export type TaskType =
  | "search"
  | "analyze"
  | "summarize"
  | "report"
  | "delegate"
  | "custom";

export interface TaskResult {
  output?: string;
  error?: string;
  citations?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  toolId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description?: string;
  type?: TaskType;
  priority: TaskPriority;
  deadline?: string;
  status: TaskStatus;
  ownerId: string;
  ownerType: "agent" | "user";
  source: string;
  missionId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimateMs?: number;
  actualTimeMs?: number;
  result?: TaskResult;
  log: TaskLogEntry[];
  toolsUsed: string[];
  toolCalls?: ToolCall[];
  citations: string[];
  retryCount: number;
  parentTaskId?: string;
  delegatedFrom?: string;
}
