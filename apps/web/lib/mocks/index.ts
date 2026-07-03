import type {
  ActivityLogItem,
  Agent,
  AgentLogEntry,
  DecisionItem,
  Document,
  PriorityItem,
  Project,
  SystemRecommendation,
} from "@/lib/types";

export const todayPriorities: PriorityItem[] = [
  {
    id: "p-1",
    title: "Dokončit návrh smlouvy pro TJ Krupka",
    priority: "critical",
    project: "TJ Krupka",
    due: "Dnes do 12:00",
    done: false,
  },
  {
    id: "p-2",
    title: "Projít feedback k MiLO_Core dashboardu",
    priority: "important",
    project: "MiLO_Core",
    due: "Dnes do 17:00",
    done: false,
  },
  {
    id: "p-3",
    title: "Připravit nabídku pro Komárku",
    priority: "low",
    project: "Komárka",
    due: "Příští týden",
    done: false,
  },
];

export const briefingSnapshot = {
  unreadEmails: 4,
  upcomingMeetings: 2,
  newDocuments: 7,
  openTasks: 12,
  activeAgents: 3,
};

export const decisions: DecisionItem[] = [
  {
    id: "d-1",
    title: "Schválit rozpočet Ninja Týden",
    description: "Agent připravil návrh rozpočtu 85 000 Kč. Čeká na schválení.",
    status: "pending",
    source: "Chief of Staff",
    date: "2026-07-03T08:30:00Z",
  },
  {
    id: "d-2",
    title: "Přidat kontakt do Gmail sync",
    description: "Legal Agent našel nový kontakt v ISDS. Přidat do Gmail kontaktů?",
    status: "pending",
    source: "Legal Agent",
    date: "2026-07-03T09:15:00Z",
  },
];

export const activityLog: ActivityLogItem[] = [
  {
    id: "a-1",
    type: "agent",
    title: "Chief of Staff vygeneroval briefing",
    description: "Denní přehled připraven v 7:00.",
    timestamp: "2026-07-03T07:00:00Z",
  },
  {
    id: "a-2",
    type: "system",
    title: "Sync Obsidian vaultu dokončen",
    description: "Indexováno 127 poznámek.",
    timestamp: "2026-07-03T06:45:00Z",
  },
  {
    id: "a-3",
    type: "user",
    title: "Otevřena stránka Projects",
    description: "Uživatel zkontroloval stav projektů.",
    timestamp: "2026-07-03T06:30:00Z",
  },
  {
    id: "a-4",
    type: "integration",
    title: "Google Calendar sync",
    description: "Nalezeny 2 nové události na dnešek.",
    timestamp: "2026-07-03T06:15:00Z",
  },
];

export const recommendation: SystemRecommendation = {
  id: "r-1",
  title: "Nejdřív vyřeš kritickou prioritu",
  description: "Smlouva pro TJ Krupka má deadline dnes v 12:00. Agent připravil podklady.",
  action: "Otevřít prioritu",
};

function emptyAgentState(status: Agent["state"]["status"]): Agent["state"] {
  const now = new Date().toISOString();
  return {
    status,
    taskProgress: 0,
    explanation: {
      currentActivity: "Čekám na úkol.",
      goal: "Být připraven přijmout a vykonat úkol.",
      reason: "Agent je inicializován a čeká na práci.",
      findings: "Zatím žádné výsledky.",
      evidence: [],
      toolsUsed: [],
      nextStep: "Čekat na přidělení úkolu.",
      estimatedCompletion: "Neurčito",
      risks: "Žádné.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Inicializace",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
      decisionLog: [],
      updatedAt: now,
    },
    pendingTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    runningTimeMs: 0,
    lastActivityAt: now,
  };
}

function baseAgent(id: string, name: string, role: string, specialization: string): Agent {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description: "Agent MiLO.",
    role,
    specialization,
    priority: "normal",
    status: "idle",
    health: { status: "healthy", lastHeartbeat: now },
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
      model: "gpt-4o",
      temperature: 0.3,
      systemPrompt: "Jsi MiLO agent.",
      knowledge: [],
      tools: [],
      permissions: { canRead: [], canWrite: [], canExecute: [] },
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 120000,
    },
    memory: {},
    createdAt: now,
    updatedAt: now,
    state: emptyAgentState("idle"),
  };
}

export const agents: Agent[] = [
  { ...baseAgent("agent-chief", "Chief of Staff", "Každodenní koordinace", "briefing"), state: emptyAgentState("working") },
  baseAgent("agent-legal", "Legal Agent", "Právní dokumenty", "contracts"),
  { ...baseAgent("agent-research", "Research Agent", "Rešerše a knowledge", "research"), state: emptyAgentState("working") },
  { ...baseAgent("agent-dev", "Developer Agent", "Vývoj a kód", "code"), state: emptyAgentState("paused") },
  baseAgent("agent-knowledge", "Knowledge Agent", "Znalostní báze", "knowledge"),
];

export const agentLogs: AgentLogEntry[] = [
  {
    id: "log-1",
    agentId: "agent-chief",
    timestamp: "2026-07-03T07:00:00Z",
    level: "info",
    message: "Briefing vygenerován za 1.2s",
  },
  {
    id: "log-2",
    agentId: "agent-research",
    timestamp: "2026-07-03T06:45:00Z",
    level: "info",
    message: "Indexováno 127 poznámek z Obsidianu",
  },
  {
    id: "log-3",
    agentId: "agent-legal",
    timestamp: "2026-07-02T16:20:00Z",
    level: "warn",
    message: "Smlouva TJ Krupka vyžaduje doplnění kontaktních údajů",
  },
];

export const projects: Project[] = [
  {
    id: "proj-tj",
    name: "TJ Krupka",
    status: "active",
    priority: "critical",
    lastActivity: "2026-07-03T08:30:00Z",
    openTasks: 5,
    documents: 12,
    description: "Právní a komunikační podpora TJ Krupka.",
    color: "bg-blue-500",
  },
  {
    id: "proj-milo",
    name: "MiLO_Core",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-03T06:15:00Z",
    openTasks: 8,
    documents: 24,
    description: "Osobní operační systém.",
    color: "bg-purple-500",
  },
  {
    id: "proj-komarka",
    name: "Komárka",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-02T14:20:00Z",
    openTasks: 3,
    documents: 6,
    description: "Web a marketing pro komárku.",
    color: "bg-emerald-500",
  },
  {
    id: "proj-ninja",
    name: "Ninja Týden",
    status: "on_hold",
    priority: "low",
    lastActivity: "2026-07-01T10:00:00Z",
    openTasks: 7,
    documents: 4,
    description: "Týdenní sportovní akce.",
    color: "bg-orange-500",
  },
  {
    id: "proj-obchod",
    name: "Obchodní příležitosti",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-02T16:45:00Z",
    openTasks: 4,
    documents: 9,
    description: "Sledování nových zakázek a poptávek.",
    color: "bg-rose-500",
  },
];

export const documents: Document[] = [
  {
    id: "doc-1",
    title: "Smlouva TJ Krupka 2026",
    type: "Smlouva",
    source: "obsidian",
    date: "2026-07-02T16:00:00Z",
    project: "TJ Krupka",
    tags: ["#právo", "#smlouva"],
    snippet: "Návrh smlouvy o spolupráci mezi TJ Krupka a dodavatelem...",
  },
  {
    id: "doc-2",
    title: "MiLO_Core architektura",
    type: "Dokumentace",
    source: "obsidian",
    date: "2026-07-01T09:00:00Z",
    project: "MiLO_Core",
    tags: ["#architektura", "#docs"],
    snippet: "Popis Domain Driven Design a struktury projektu...",
  },
  {
    id: "doc-3",
    title: "Ninja Týden rozpočet",
    type: "Tabulka",
    source: "drive",
    date: "2026-06-28T11:30:00Z",
    project: "Ninja Týden",
    tags: ["#rozpočet"],
    snippet: "Rozpočet akce včetně nákladů na pronájem a catering...",
  },
  {
    id: "doc-4",
    title: "Re: Poptávka webu Komárka",
    type: "Email",
    source: "gmail",
    date: "2026-07-02T08:15:00Z",
    project: "Komárka",
    tags: ["#email", "#poptávka"],
    snippet: "Dobrý den, děkuji za poptávku. Posílám orientační nabídku...",
  },
  {
    id: "doc-5",
    title: "ISDS: Doručenka 123456",
    type: "Doručenka",
    source: "isds",
    date: "2026-07-01T13:45:00Z",
    project: "TJ Krupka",
    tags: ["#isds", "#doručenka"],
    snippet: "Doručenka byla přijata do datové schránky...",
  },
  {
    id: "doc-6",
    title: "Marketingová strategie Q3",
    type: "Dokument",
    source: "upload",
    date: "2026-06-30T10:00:00Z",
    project: "Obchodní příležitosti",
    tags: ["#marketing", "#strategie"],
    snippet: "Strategie pro třetí čtvrtletí s důrazem na sociální sítě...",
  },
];


