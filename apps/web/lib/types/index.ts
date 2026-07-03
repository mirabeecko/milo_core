export type Priority = "critical" | "important" | "low";
export type Status = "active" | "idle" | "paused" | "error";
export type AgentStatus = "idle" | "working" | "waiting" | "paused" | "offline" | "error";

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

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt: string;
  knowledge: string[];
  tools: string[];
  permissions: {
    canRead: string[];
    canWrite: string[];
    canExecute: string[];
  };
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  timeoutMs: number;
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
  decisionLog: { timestamp: string; thought: string }[];
  updatedAt: string;
}

export interface AgentState {
  status: AgentStatus;
  activeTaskId?: string;
  explanation: LiveWorkExplanation;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
}
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";
export type DocumentSource = "obsidian" | "drive" | "gmail" | "upload" | "isds";
export type DecisionStatus = "pending" | "approved" | "rejected" | "snoozed";

export interface PriorityItem {
  id: string;
  title: string;
  priority: Priority;
  project?: string;
  due?: string;
  done: boolean;
}

export interface BriefingSnapshot {
  unreadEmails: number;
  upcomingMeetings: number;
  newDocuments: number;
  openTasks: number;
  activeAgents: number;
}

export interface DecisionItem {
  id: string;
  title: string;
  description: string;
  status: DecisionStatus;
  source: string;
  date: string;
}

export interface ActivityLogItem {
  id: string;
  type: "agent" | "system" | "user" | "integration";
  title: string;
  description: string;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  specialization: string;
  priority: "critical" | "high" | "normal" | "low";
  status: AgentStatus;
  health: AgentHealth;
  metrics: AgentMetrics;
  config: AgentConfig;
  memory: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  state: AgentState;
}

export interface AgentLogEntry {
  id: string;
  agentId: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  lastActivity: string;
  openTasks: number;
  documents: number;
  description: string;
  color: string;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  source: DocumentSource;
  date: string;
  project?: string;
  tags: string[];
  snippet: string;
}

export interface ObsidianNote {
  id: string;
  title: string;
  path: string;
  content: string;
  modifiedAt: string;
  tags: string[];
}

export interface ObsidianStatus {
  configured: boolean;
  demo: boolean;
  vaultPath?: string;
  noteCount: number;
  indexedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
  suggestedActions?: string[];
}

export interface AiSettings {
  provider: "openai" | "anthropic" | "ollama" | "groq";
  model: string;
  baseUrl?: string;
}

export interface TtsSettings {
  enabled: boolean;
  autoSpeak: boolean;
  voice?: string;
  rate: number;
}

export interface IntegrationsSettings {
  obsidianVaultPath?: string;
  gmailEnabled: boolean;
  calendarEnabled: boolean;
  driveEnabled: boolean;
  supabaseEnabled: boolean;
  ollamaEnabled: boolean;
}

export interface SystemRecommendation {
  id: string;
  title: string;
  description: string;
  action?: string;
}
