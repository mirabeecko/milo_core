export type Priority = "critical" | "important" | "low";
export type Status = "active" | "idle" | "paused" | "error";
export type AgentStatus = "running" | "idle" | "paused" | "error" | "disabled";
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
  role: string;
  description: string;
  status: AgentStatus;
  lastActive: string;
  currentTask?: string;
  icon: string;
}

export interface AgentLogEntry {
  id: string;
  agentId: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
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
