export interface AgentLogEntry {
  id: string;
  agentId: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AgentMemoryEntry {
  id: string;
  agentId: string;
  key: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMetricsSnapshot {
  id: string;
  agentId: string;
  timestamp: string;
  tasksCompleted: number;
  tasksFailed: number;
  avgResponseTimeMs: number;
  uptimeSeconds: number;
  lastHeartbeat: string;
  status: string;
}
