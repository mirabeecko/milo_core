export type AgentStatus =
  | "idle"
  | "thinking"
  | "planning"
  | "delegating"
  | "working"
  | "waiting"
  | "reviewing"
  | "reporting"
  | "paused"
  | "offline"
  | "error";

export type AgentPriority = "critical" | "high" | "normal" | "low";

export interface AgentHealth {
  status: "healthy" | "degraded" | "unhealthy";
  lastHeartbeat: string;
  message?: string;
}

export interface AgentMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  retriedTasks: number;
  averageDurationMs: number;
  totalTokens?: number;
  errorCount: number;
  lastUpdatedAt: string;
}

export interface AgentPermissions {
  canRead: string[];
  canWrite: string[];
  canExecute: string[];
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt: string;
  knowledge: string[];
  tools: string[];
  permissions: AgentPermissions;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  timeoutMs: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  specialization: string;
  priority: AgentPriority;
  status: AgentStatus;
  health: AgentHealth;
  metrics: AgentMetrics;
  config: AgentConfig;
  memory: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  role: string;
  specialization: string;
  priority: AgentPriority;
  config: AgentConfig;
}

export interface AgentSnapshot {
  agent: Agent;
  activeTaskId?: string;
  explanation: LiveWorkExplanation;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
}

export interface LiveWorkExplanation {
  currentActivity: string;
  goal: string;
  reason: string;
  findings: string;
  evidence: string[];
  toolsUsed: string[];
  nextStep: string;
  estimatedCompletion: string;
  risks: string;
  needsFromUser: string;
  lastCompletedStep: string;
  confidence: string;
  alternativeApproach: string;
  decisionLog: DecisionLogEntry[];
  updatedAt: string;
}

export interface DecisionLogEntry {
  timestamp: string;
  thought: string;
}

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
  metrics: AgentMetrics;
}
