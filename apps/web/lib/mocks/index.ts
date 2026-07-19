import type {
  ActivityLogItem,
  Agent,
  AgentIcon,
  AgentLogEntry,
  DecisionItem,
  Document,
  PriorityItem,
  Project,
  SystemRecommendation,
} from "@/lib/types";

export const todayPriorities: PriorityItem[] = [];

export const briefingSnapshot = {
  unreadEmails: 0,
  upcomingMeetings: 0,
  newDocuments: 0,
  openTasks: 0,
  activeAgents: 0,
};

export const decisions: DecisionItem[] = [];

export const activityLog: ActivityLogItem[] = [];

export const weather = null;

export const aiSummary = {
  unreadEmails: 0,
  emailSenders: [],
  siteVisits: [],
  totalVisits: 0,
  insight: "Data nejsou k dispozici — připojte Google Analytics",
};

export const recommendation: SystemRecommendation | null = null;

export const demo = true;

export const agents: Agent[] = [];

export const agentLogs: AgentLogEntry[] = [];

export const projects: Project[] = [];

export const documents: Document[] = [];

export function emptyAgentState(): Agent["state"] {
  return {
    status: "offline" as const,
    activeTaskId: undefined,
    taskProgress: 0,
    explanation: {
      currentActivity: "Data nejsou k dispozici",
      goal: "",
      reason: "",
      findings: "",
      evidence: [],
      toolsUsed: [],
      nextStep: "",
      estimatedCompletion: "",
      risks: "",
      needsFromUser: "",
      lastCompletedStep: "",
      confidence: "",
      alternativeApproach: "",
      decisionLog: [],
      updatedAt: new Date().toISOString(),
    },
    pendingTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    runningTimeMs: 0,
    lastActivityAt: undefined,
  };
}

export function baseAgent(): Agent {
  const now = new Date().toISOString();
  return {
    id: "",
    name: "",
    description: "",
    role: "",
    specialization: "",
    icon: "bot" as AgentIcon,
    priority: "low" as const,
    status: "offline" as const,
    health: { status: "healthy" as const, lastHeartbeat: now },
    metrics: {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      retriedTasks: 0,
      averageDurationMs: 0,
      errorCount: 0,
      lastUpdatedAt: now,
    },
    config: {
      model: "",
      temperature: 0,
      systemPrompt: "",
      knowledge: [],
      tools: [],
      permissions: { canRead: [], canWrite: [], canExecute: [] },
      retryPolicy: { maxRetries: 0, backoffMs: 0 },
      timeoutMs: 0,
    },
    memory: {},
    createdAt: now,
    updatedAt: now,
    state: emptyAgentState(),
  };
}
