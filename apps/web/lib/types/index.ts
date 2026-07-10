export type Priority = "critical" | "important" | "low";
export type Status = "active" | "idle" | "paused" | "error";
export type AgentStatus =
  | "idle"
  | "starting"
  | "thinking"
  | "planning"
  | "delegating"
  | "working"
  | "waiting"
  | "reviewing"
  | "reporting"
  | "loading_calendar"
  | "loading_messages"
  | "analyzing"
  | "scheduling"
  | "summarizing"
  | "drafting_reply"
  | "reading_code"
  | "implementing"
  | "testing"
  | "building"
  | "deploying"
  | "paused"
  | "stopping"
  | "recovering"
  | "offline"
  | "error";

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
  confidence: string;
  alternativeApproach: string;
  decisionLog: { timestamp: string; thought: string }[];
  updatedAt: string;
}

export interface AgentState {
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
  source?: "user" | "agent";
  agentName?: string;
}

export interface BriefingSnapshot {
  unreadEmails: number;
  upcomingMeetings: number;
  newDocuments: number;
  openTasks: number;
  activeAgents: number;
  activeProjects: number;
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

export type TaskStatus = "pending" | "queued" | "running" | "waiting" | "paused" | "completed" | "failed" | "cancelled";
export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskSource = "user" | "agent" | "schedule" | "system";

export interface TaskLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId: string;
  ownerType: "user" | "agent";
  source: TaskSource;
  log: TaskLogEntry[];
  toolsUsed: string[];
  citations: string[];
  retryCount: number;
  estimateMs?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  result?: string | Record<string, unknown>;
}

export interface ProjectCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
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
  goal?: string;
  done_summary?: string;
  remaining_summary?: string;
  time_spent_hours?: number;
  time_estimate_hours?: number;
  cost_spent?: number;
  cost_estimate?: number;
  github_url?: string | null;
  last_commit?: ProjectCommit | null;
  commit_count?: number;
  path?: string;
}

export interface ProjectUsage {
  totalMinutes: number;
  totalCost: number;
  entries: Array<{
    project: string;
    agent: string;
    model: string;
    provider: string;
    minutes: number;
    cost_usd: number;
    task_description: string;
    timestamp: string;
  }>;
  breakdown: Record<string, {
    model: string;
    provider: string;
    minutes: number;
    cost: number;
    tasks: string[];
  }>;
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
  message?: string;
}

export interface Calendar {
  id: string;
  name: string;
  color?: string;
  primary: boolean;
  provider: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  isAllDay: boolean;
  organizer?: string;
  attendees: string[];
  status: "confirmed" | "tentative" | "cancelled";
  calendarId: string;
  color?: string;
}

export interface CalendarConflict {
  id: string;
  eventA: CalendarEvent;
  eventB: CalendarEvent;
  overlapMinutes: number;
  severity: "critical" | "warning" | "info";
  suggestion?: string;
}

export interface CalendarSuggestion {
  id: string;
  type: "move" | "focus_time" | "deep_work" | "break" | "cancel" | "optimize";
  title: string;
  description: string;
  reason: string;
  impact: "high" | "medium" | "low";
  relatedEventIds: string[];
  proposedStart?: string;
  proposedEnd?: string;
}

export interface DayAnalysis {
  date: string;
  totalEventMinutes: number;
  freeMinutes: number;
  focusTimeMinutes: number;
  deepWorkMinutes: number;
  breakMinutes: number;
  eventCount: number;
  conflictCount: number;
  overloaded: boolean;
  productivityScore: number;
}

export interface CalendarAgentState {
  calendars: Calendar[];
  todayEvents: CalendarEvent[];
  analysis?: DayAnalysis;
  conflicts: CalendarConflict[];
  suggestions: CalendarSuggestion[];
  upcoming: CalendarEvent[];
  lastSyncedAt?: string;
  taskProgress: number;
}

export type MessageChannel = "gmail" | "whatsapp" | "telegram" | "teams" | "slack" | "isds" | "sms";
export type MessagePriority = "critical" | "important" | "normal" | "low" | "spam";
export type MessageStatus = "unread" | "read" | "replied" | "archived" | "snoozed";

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
}

export interface ContactRef {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CommContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  company?: string;
  projects: string[];
  lastContactAt?: string;
  openTasks: number;
  recentTopics: string[];
  openCommitments: string[];
  recommendedTone: "formal" | "friendly" | "legal" | "business" | "casual";
  escalationRisk: "high" | "medium" | "low";
  totalMessages: number;
  averageResponseTimeHours?: number;
}

export interface CommMessage {
  id: string;
  channel: MessageChannel;
  sender: ContactRef;
  recipients: ContactRef[];
  subject: string;
  body: string;
  summary?: string;
  priority: MessagePriority;
  status: MessageStatus;
  sentAt: string;
  receivedAt: string;
  threadId?: string;
  attachments: MessageAttachment[];
  extractedTasks: string[];
  extractedDates: string[];
  extractedAmounts: string[];
  tags: string[];
  isSpam: boolean;
  needsReply: boolean;
  replyDueAt?: string;
}

export interface CommThread {
  id: string;
  subject: string;
  channel: MessageChannel;
  participants: ContactRef[];
  messages: CommMessage[];
  lastMessageAt: string;
  priority: MessagePriority;
  summary?: string;
  needsReply: boolean;
  replyDueAt?: string;
}

export interface MessageSummary {
  summary: string;
  keyPoints: string[];
  requests: string[];
  deadlines: string[];
  tasks: string[];
  contacts: string[];
  amounts: string[];
  suggestedNextSteps: string[];
  sentiment: "positive" | "neutral" | "negative" | "urgent";
}

export interface DraftReply {
  id: string;
  messageId: string;
  tone: "short" | "formal" | "friendly" | "legal" | "business";
  content: string;
  generatedAt: string;
}

export interface CommunicationStats {
  newMessages: number;
  unreadMessages: number;
  waitingForReply: number;
  drafts: number;
  spam: number;
  repliedToday: number;
  averageResponseTimeHours?: number;
  aiSuggestionsGenerated: number;
}

export interface SecretaryAgentState {
  messages: CommMessage[];
  threads: CommThread[];
  contacts: CommContact[];
  waitingForReply: CommMessage[];
  drafts: DraftReply[];
  stats: CommunicationStats;
  summaries: Record<string, MessageSummary>;
  lastSyncedAt?: string;
  taskProgress: number;
}

export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type IssueCategory =
  | "clean-architecture"
  | "dry"
  | "solid"
  | "type-safety"
  | "naming"
  | "performance"
  | "security"
  | "accessibility"
  | "duplication"
  | "technical-debt"
  | "test-coverage";

export interface ProjectIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  category: IssueCategory;
  filePath?: string;
  lineNumber?: number;
  suggestedFix?: string;
}

export interface CodeReviewFinding {
  id: string;
  rule: string;
  category: IssueCategory;
  severity: IssueSeverity;
  filePath: string;
  message: string;
  suggestion: string;
}

export interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  languages: Record<string, number>;
  packages: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitInfo {
  branch: string;
  lastCommit: GitCommit;
  lastMerge?: GitCommit;
  commitCount: number;
  recentCommits: GitCommit[];
  branches: string[];
}

export interface BuildResult {
  status: "success" | "failure" | "running" | "unknown";
  durationMs?: number;
  warnings: string[];
  errors: string[];
  timestamp?: string;
}

export interface TestResult {
  status: "success" | "failure" | "running" | "unknown";
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage?: number;
  durationMs?: number;
  failedTestNames: string[];
  timestamp?: string;
}

export interface LintResult {
  status: "success" | "failure" | "running" | "unknown";
  warnings: string[];
  errors: string[];
  timestamp?: string;
}

export interface ArchitectureScore {
  overall: number;
  cleanArchitecture: number;
  dry: number;
  solid: number;
  typeSafety: number;
  naming: number;
  performance: number;
  security: number;
}

export interface DeveloperAgentState {
  projectPath: string;
  stats?: ProjectStats;
  git?: GitInfo;
  issues: ProjectIssue[];
  findings: CodeReviewFinding[];
  build?: BuildResult;
  tests?: TestResult;
  lint?: LintResult;
  architectureScore?: ArchitectureScore;
  technicalDebt: number;
  lastSyncedAt?: string;
  taskProgress: number;
}

export interface ReminderItem {
  id: string;
  time: string;
  description: string;
  project_ref?: string;
  reminder_options: string[];
  selected_options: string[];
  status: "pending" | "notified" | "dismissed";
  source: "calendar" | "task" | "email";
  source_id?: string;
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

export interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  snippet: string;
  isRead: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  receivedAt: string;
  senderName: string;
}

export interface WeatherData {
  location: string;
  condition: "clear" | "cloudy" | "rain" | "snow" | "storm" | "fog";
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  forecast: {
    time: string;
    temperature: number;
    condition: WeatherData["condition"];
  }[];
}

export interface Ga4SiteVisit {
  site: string;
  visits: number;
  uniqueVisitors: number;
  changePercent: number;
  topPage?: string;
}

export interface AiSummary {
  unreadEmails: number;
  emailSenders: string[];
  siteVisits: Ga4SiteVisit[];
  totalVisits: number;
  insight: string;
}
