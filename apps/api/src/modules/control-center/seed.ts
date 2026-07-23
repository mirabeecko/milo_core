import { controlCenterStore, type ControlCenterSeedData } from "./store.js";
import type {
  AgentSpec,
  AgentSpecVersion,
  UseCase,
  UseCaseVersion,
  AgentCapability,
  Tool,
  AgentTool,
  Integration,
} from "@milo/shared";

const now = new Date().toISOString();

// ─── DEPARTMENTS ───────────────────────────────────────────────

const departments = [
  {
    id: "dept-operations", name: "🧭 OPERATIONS",
    description: "Koordinace, komunikace, evidence nápadů",
    lead: "chief-of-staff", agents: ["chief-of-staff", "spy-g", "communicator"],
    createdAt: now,
  },
  {
    id: "dept-engineering", name: "⚙️ ENGINEERING",
    description: "Vývoj, deployment, infrastruktura",
    lead: "developer", agents: ["developer", "infrastructure"],
    createdAt: now,
  },
  {
    id: "dept-intelligence", name: "🔬 INTELLIGENCE",
    description: "Research, analýza dat, rešerše",
    lead: "analyst", agents: ["analyst"],
    createdAt: now,
  },
];

// ─── AGENTS ────────────────────────────────────────────────────

const allAgents: AgentSpec[] = [
  {
    id: "chief-of-staff", slug: "chief-of-staff", name: "Chief of Staff",
    description: "Digitální ředitel kanceláře — plánuje, prioritizuje, deleguje, kontroluje, reportuje",
    purpose: "Koordinovat agenty, připravovat briefing, delegovat úkoly, řídit priority",
    category: "coordinator", owner: "a_Team", status: "specified",
    lifecycleStatus: "specified", priority: "critical", riskLevel: "low",
    department: "dept-operations",
    activeVersionId: null, deployedVersionId: null,
    implementationStatus: "partial", runtimeStatus: "simulated", progressPercent: 80,
    tags: ["a_Team", "core"],
    createdAt: now, updatedAt: now,
  },
  {
    id: "spy-g", slug: "spy-g", name: "SPY_G",
    description: "Skrytý pozorovatel — naslouchá, zaznamenává, hodnotí důležitost. Dohlíží na gamechanger nápady.",
    purpose: "Zachytit důležité nápady a požadavky, spravovat watchlist, posílat reporty, propojovat nápady s projekty",
    category: "observer", owner: "a_Team", status: "specified",
    lifecycleStatus: "specified", priority: "high", riskLevel: "low",
    department: "dept-operations",
    activeVersionId: null, deployedVersionId: null,
    implementationStatus: "partial", runtimeStatus: "simulated", progressPercent: 80,
    tags: ["a_Team", "core"],
    createdAt: now, updatedAt: now,
  },
  {
    id: "communicator", slug: "communicator", name: "Komunikátor",
    description: "Komunikační manažer — email triage, kalendář, kontakty, notifikace, příprava schůzek",
    purpose: "Spravovat veškerou komunikaci — emaily, kalendář, kontakty, notifikace na WhatsApp/Telegram",
    category: "communication", owner: "a_Team", status: "specified",
    lifecycleStatus: "specified", priority: "high", riskLevel: "low",
    department: "dept-operations",
    activeVersionId: null, deployedVersionId: null,
    implementationStatus: "partial", runtimeStatus: "simulated", progressPercent: 73,
    tags: ["a_Team", "core"],
    createdAt: now, updatedAt: now,
  },
  {
    id: "developer", slug: "developer", name: "Developer",
    description: "Senior software engineer — kód, GitHub, CI/CD, code review, implementace",
    purpose: "Vyvíjet, opravovat a udržovat kód — analýza buildu, opravy bugů, nové featury",
    category: "engineering", owner: "a_Team", status: "specified",
    lifecycleStatus: "specified", priority: "high", riskLevel: "medium",
    department: "dept-engineering",
    activeVersionId: null, deployedVersionId: null,
    implementationStatus: "partial", runtimeStatus: "simulated", progressPercent: 78,
    tags: ["a_Team", "core"],
    createdAt: now, updatedAt: now,
  },
  {
    id: "infrastructure", slug: "infrastructure", name: "Infrastruktura",
    description: "DevOps & Monitoring — deployment, health checky, auto-healing, testování, monitoring zdrojů",
    purpose: "Udržovat systém v chodu — nasazování, monitoring, automatická obnova při výpadku",
    category: "engineering", owner: "a_Team", status: "specified",
    lifecycleStatus: "specified", priority: "high", riskLevel: "medium",
    department: "dept-engineering",
    activeVersionId: null, deployedVersionId: null,
    implementationStatus: "partial", runtimeStatus: "simulated", progressPercent: 73,
    tags: ["a_Team", "core"],
    createdAt: now, updatedAt: now,
  },
  {
    id: "analyst", slug: "analyst", name: "Analytik",
    description: "Research & Data agent — rešerše, analýza dokumentů, data extraction, knowledge base",
    purpose: "Zpracovávat informace — vyhledávání, analýza dokumentů, market research, strukturované výstupy",
    category: "intelligence", owner: "a_Team", status: "specified",
    lifecycleStatus: "specified", priority: "normal", riskLevel: "low",
    department: "dept-intelligence",
    activeVersionId: null, deployedVersionId: null,
    implementationStatus: "partial", runtimeStatus: "simulated", progressPercent: 73,
    tags: ["a_Team", "core"],
    createdAt: now, updatedAt: now,
  },
];

const allAgentVersions: Omit<AgentSpecVersion, "id" | "createdAt">[] = allAgents.map((a) => ({
  agentId: a.id, versionNumber: 1, versionLabel: "v4.0-initial",
  specification: {
    name: a.name, description: a.description, purpose: a.purpose,
    allowedActions: [], requiredApprovals: [],
    operationalRules: {},
    systemPrompt: `Jsi ${a.name} — ${a.purpose} Odpovídej česky, stručně, profesionálně.`,
    tools: [],
    integrations: [],
    failoverBehavior: "retry",
  },
  changeSummary: "MiLO v4 — redukce na 6 specializovaných agentů ve 3 departments",
  createdBy: "system",
  status: "draft",
  activeFrom: null,
  updatedAt: now,
}));

// ─── USE CASES ─────────────────────────────────────────────────

const useCases: UseCase[] = [
  // Chief of Staff
  { id: "uc-cos-briefing", agentId: "chief-of-staff", slug: "morning-briefing", name: "Ranní briefing",
    description: "Každé ráno vygenerovat přehled dne", purpose: "Začít den s přehledem",
    triggerDescription: "7:30 každý den", category: "core", priority: "critical",
    riskLevel: "low", status: "ready_for_planning", implementationStatus: "partial",
    progressPercent: 75, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-cos-delegate", agentId: "chief-of-staff", slug: "task-delegation", name: "Delegace úkolů",
    description: "Dekomponovat misi a rozdělit agentům", purpose: "Efektivní distribuce práce",
    triggerDescription: "Nový úkol od uživatele", category: "core", priority: "critical",
    riskLevel: "medium", status: "ready_for_planning", implementationStatus: "partial",
    progressPercent: 65, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-cos-prioritize", agentId: "chief-of-staff", slug: "prioritization", name: "Prioritizace",
    description: "Seřadit projekty a úkoly podle důležitosti", purpose: "Fokus na to nejdůležitější",
    triggerDescription: "Na vyžádání", category: "core", priority: "high",
    riskLevel: "low", status: "draft", implementationStatus: "not_started",
    progressPercent: 20, activeVersionId: null, createdAt: now, updatedAt: now },

  // SPY_G
  { id: "uc-spyg-capture", agentId: "spy-g", slug: "capture-idea", name: "Zachycení nápadu",
    description: "Zachytit a vyhodnotit nový nápad", purpose: "Nic důležitého neztratit",
    triggerDescription: "Uživatel zmíní nápad", category: "core", priority: "high",
    riskLevel: "low", status: "ready_for_planning", implementationStatus: "partial",
    progressPercent: 80, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-spyg-report", agentId: "spy-g", slug: "daily-report", name: "Denní přehled",
    description: "Report s top prioritami a gamechanger nápady", purpose: "Přehled o zachycených nápadech",
    triggerDescription: "Každý večer", category: "core", priority: "high",
    riskLevel: "low", status: "draft", implementationStatus: "partial",
    progressPercent: 60, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-spyg-link", agentId: "spy-g", slug: "link-to-project", name: "Propojení s projektem",
    description: "Najít relevantní projekt pro nápad", purpose: "Převádět nápady na akční položky",
    triggerDescription: "Nový nápad s vysokou relevancí", category: "core", priority: "normal",
    riskLevel: "low", status: "draft", implementationStatus: "not_started",
    progressPercent: 10, activeVersionId: null, createdAt: now, updatedAt: now },

  // Komunikátor
  { id: "uc-comm-email", agentId: "communicator", slug: "email-triage", name: "Email triage",
    description: "Třídění inboxu, AI shrnutí, návrhy odpovědí", purpose: "Minimalizovat čas strávený emaily",
    triggerDescription: "Nové emaily", category: "core", priority: "high",
    riskLevel: "low", status: "draft", implementationStatus: "partial",
    progressPercent: 50, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-comm-calendar", agentId: "communicator", slug: "calendar-mgmt", name: "Správa kalendáře",
    description: "Události, kolize, focus time, připomenutí", purpose: "Efektivní time management",
    triggerDescription: "Požadavek na správu kalendáře", category: "core", priority: "high",
    riskLevel: "low", status: "draft", implementationStatus: "partial",
    progressPercent: 45, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-comm-notify", agentId: "communicator", slug: "notifications", name: "Notifikace",
    description: "Rozesílání přes Telegram/WhatsApp dle priority", purpose: "Včasné informování",
    triggerDescription: "Událost vyžadující notifikaci", category: "core", priority: "normal",
    riskLevel: "low", status: "draft", implementationStatus: "partial",
    progressPercent: 40, activeVersionId: null, createdAt: now, updatedAt: now },

  // Developer
  { id: "uc-dev-build", agentId: "developer", slug: "build-analysis", name: "Analýza buildu",
    description: "Zjistit proč build spadl a opravit", purpose: "Udržet CI/CD v chodu",
    triggerDescription: "Build selže", category: "core", priority: "critical",
    riskLevel: "medium", status: "ready_for_planning", implementationStatus: "partial",
    progressPercent: 70, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-dev-review", agentId: "developer", slug: "code-review", name: "Code review",
    description: "Zreviewovat pull request", purpose: "Kvalita kódu",
    triggerDescription: "Nový PR", category: "core", priority: "normal",
    riskLevel: "low", status: "draft", implementationStatus: "not_started",
    progressPercent: 30, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-dev-feature", agentId: "developer", slug: "feature-impl", name: "Implementace featury",
    description: "Implementovat novou funkcionalitu dle specifikace", purpose: "Rozvoj systému",
    triggerDescription: "Schválená specifikace", category: "core", priority: "high",
    riskLevel: "medium", status: "draft", implementationStatus: "not_started",
    progressPercent: 60, activeVersionId: null, createdAt: now, updatedAt: now },

  // Infrastruktura
  { id: "uc-infra-deploy", agentId: "infrastructure", slug: "deployment", name: "Deployment",
    description: "Nasadit aplikaci na Vercel/Railway", purpose: "Dostat kód do produkce",
    triggerDescription: "Požadavek na nasazení", category: "core", priority: "high",
    riskLevel: "medium", status: "draft", implementationStatus: "partial",
    progressPercent: 60, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-infra-health", agentId: "infrastructure", slug: "health-monitoring", name: "Health monitoring",
    description: "Kontrola API, webu, Redis, tunelů", purpose: "Včasná detekce výpadků",
    triggerDescription: "Každých 5 minut", category: "core", priority: "critical",
    riskLevel: "low", status: "draft", implementationStatus: "partial",
    progressPercent: 50, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-infra-heal", agentId: "infrastructure", slug: "auto-healing", name: "Auto-healing",
    description: "Restart spadlých služeb, obnova tunelu", purpose: "Minimalizovat downtime",
    triggerDescription: "Detekce výpadku", category: "core", priority: "critical",
    riskLevel: "high", status: "draft", implementationStatus: "partial",
    progressPercent: 40, activeVersionId: null, createdAt: now, updatedAt: now },

  // Analytik
  { id: "uc-an-research", agentId: "analyst", slug: "research", name: "Rešerše",
    description: "Prohledat web, dokumenty, DB a shrnout", purpose: "Získat relevantní informace",
    triggerDescription: "Požadavek na rešerši", category: "core", priority: "high",
    riskLevel: "low", status: "draft", implementationStatus: "partial",
    progressPercent: 50, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-an-docs", agentId: "analyst", slug: "document-analysis", name: "Analýza dokumentů",
    description: "Přečíst PDF/smlouvu a extrahovat klíčové body", purpose: "Rychlá orientace v dokumentech",
    triggerDescription: "Nový dokument", category: "core", priority: "normal",
    riskLevel: "low", status: "draft", implementationStatus: "not_started",
    progressPercent: 30, activeVersionId: null, createdAt: now, updatedAt: now },
  { id: "uc-an-market", agentId: "analyst", slug: "market-research", name: "Market research",
    description: "Analýza konkurence, trendů, příležitostí", purpose: "Informovaná rozhodnutí",
    triggerDescription: "Požadavek na analýzu trhu", category: "core", priority: "normal",
    riskLevel: "low", status: "draft", implementationStatus: "not_started",
    progressPercent: 20, activeVersionId: null, createdAt: now, updatedAt: now },
];

const useCaseVersions: Omit<UseCaseVersion, "id" | "createdAt">[] = useCases.map((uc) => ({
  useCaseId: uc.id, versionNumber: 1, versionLabel: "v4.0-initial",
  purpose: uc.purpose, triggerDescription: uc.triggerDescription,
  inputs: [], preconditions: [], workflowSteps: [], decisionRules: [],
  tools: [], integrations: [], outputs: [], persistenceRules: null,
  approvalRules: {}, securityRules: {}, failureStates: [], fallbackBehavior: null,
  testScenarios: [], definitionOfDone: [], observabilityRequirements: {},
  specification: { name: uc.name, description: uc.description, purpose: uc.purpose },
  changeSummary: "MiLO v4",
  createdBy: "system", status: "draft",
}));

// ─── CAPABILITIES ──────────────────────────────────────────────

const allCapabilities: AgentCapability[] = [
  { id: "cap-ai-summary", capabilityCode: "ai_summary", name: "AI Summary",
    description: "AI sumarizace textu", inputs: [{ name: "text", type: "string" }],
    outputs: [{ name: "summary", type: "string" }], apiInterface: null, dependencies: [],
    status: "planned", maturityLevel: "concept", owner: "engineering",
    activeVersion: null, progressPercent: 50, createdAt: now, updatedAt: now },
  { id: "cap-code-search", capabilityCode: "code_search", name: "Code Search",
    description: "Vyhledávání v kódu, diagnostika chyb", inputs: [{ name: "query", type: "string" }],
    outputs: [{ name: "results", type: "array" }], apiInterface: null, dependencies: [],
    status: "planned", maturityLevel: "concept", owner: "engineering",
    activeVersion: null, progressPercent: 0, createdAt: now, updatedAt: now },
  { id: "cap-git-operations", capabilityCode: "git_operations", name: "Git Operations",
    description: "Práce s gitem", inputs: [{ name: "operation", type: "string" }],
    outputs: [{ name: "result", type: "object" }], apiInterface: null, dependencies: [],
    status: "planned", maturityLevel: "concept", owner: "engineering",
    activeVersion: null, progressPercent: 0, createdAt: now, updatedAt: now },
  { id: "cap-email-triage", capabilityCode: "email_triage", name: "Email Triage",
    description: "Třídění emailů dle priority a kontextu", inputs: [{ name: "email", type: "object" }],
    outputs: [{ name: "label", type: "string" }, { name: "summary", type: "string" }],
    apiInterface: null, dependencies: [], status: "planned", maturityLevel: "concept",
    owner: "operations", activeVersion: null, progressPercent: 30, createdAt: now, updatedAt: now },
  { id: "cap-deployment", capabilityCode: "deployment", name: "Deployment",
    description: "Nasazení aplikace na cloud", inputs: [{ name: "target", type: "string" }],
    outputs: [{ name: "url", type: "string" }], apiInterface: null, dependencies: [],
    status: "planned", maturityLevel: "concept", owner: "engineering",
    activeVersion: null, progressPercent: 40, createdAt: now, updatedAt: now },
  { id: "cap-health-check", capabilityCode: "health_check", name: "Health Check",
    description: "Kontrola dostupnosti služeb", inputs: [{ name: "service", type: "string" }],
    outputs: [{ name: "status", type: "string" }], apiInterface: null, dependencies: [],
    status: "planned", maturityLevel: "concept", owner: "engineering",
    activeVersion: null, progressPercent: 50, createdAt: now, updatedAt: now },
];

// ─── TOOLS ─────────────────────────────────────────────────────

const allTools: Tool[] = [
  { id: "tool-gmail", name: "gmail", type: "external", provider: "Google Gmail API",
    description: "Gmail integrace", configurationSchema: null, secretReference: "GOOGLE_CREDENTIALS",
    availabilityStatus: "configured", healthStatus: "healthy", riskLevel: "medium", createdAt: now },
  { id: "tool-calendar", name: "calendar", type: "external", provider: "Google Calendar API",
    description: "Google Kalendář", configurationSchema: null, secretReference: "GOOGLE_CREDENTIALS",
    availabilityStatus: "configured", healthStatus: "healthy", riskLevel: "low", createdAt: now },
  { id: "tool-filesystem", name: "filesystem", type: "local", provider: null,
    description: "Lokální souborový systém", configurationSchema: null, secretReference: null,
    availabilityStatus: "available", healthStatus: "healthy", riskLevel: "low", createdAt: now },
  { id: "tool-github", name: "github", type: "external", provider: "GitHub API",
    description: "GitHub operace", configurationSchema: null, secretReference: "GITHUB_TOKEN",
    availabilityStatus: "unconfigured", healthStatus: "unknown", riskLevel: "medium", createdAt: now },
  { id: "tool-shell", name: "shell", type: "local", provider: null,
    description: "Shell příkazy", configurationSchema: null, secretReference: null,
    availabilityStatus: "available", healthStatus: "healthy", riskLevel: "high", createdAt: now },
  { id: "tool-web-search", name: "web-search", type: "external", provider: null,
    description: "Web vyhledávání", configurationSchema: null, secretReference: null,
    availabilityStatus: "available", healthStatus: "healthy", riskLevel: "low", createdAt: now },
  { id: "tool-memory", name: "memory", type: "internal", provider: "Hermes",
    description: "Perzistentní paměť", configurationSchema: null, secretReference: null,
    availabilityStatus: "available", healthStatus: "healthy", riskLevel: "low", createdAt: now },
  { id: "tool-cron", name: "cronjob", type: "internal", provider: "Hermes",
    description: "Plánování úloh", configurationSchema: null, secretReference: null,
    availabilityStatus: "available", healthStatus: "healthy", riskLevel: "low", createdAt: now },
  { id: "tool-delegate", name: "delegate_task", type: "internal", provider: "Hermes",
    description: "Delegace úkolů sub-agentům", configurationSchema: null, secretReference: null,
    availabilityStatus: "available", healthStatus: "healthy", riskLevel: "low", createdAt: now },
  { id: "tool-notify", name: "send_message", type: "internal", provider: "Hermes",
    description: "Posílání zpráv", configurationSchema: null, secretReference: null,
    availabilityStatus: "available", healthStatus: "healthy", riskLevel: "low", createdAt: now },
];

// ─── AGENT TOOLS ───────────────────────────────────────────────

const agentToolsList: AgentTool[] = [
  // Chief of Staff
  { agentId: "chief-of-staff", toolId: "tool-gmail", allowedActions: ["read"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "chief-of-staff", toolId: "tool-calendar", allowedActions: ["read"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "chief-of-staff", toolId: "tool-delegate", allowedActions: ["delegate"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "chief-of-staff", toolId: "tool-memory", allowedActions: ["read", "write"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "chief-of-staff", toolId: "tool-cron", allowedActions: ["create", "list"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "chief-of-staff", toolId: "tool-filesystem", allowedActions: ["read"], approvalRequiredActions: [], configuration: {}, enabled: true },
  // SPY_G
  { agentId: "spy-g", toolId: "tool-filesystem", allowedActions: ["read", "write"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "spy-g", toolId: "tool-memory", allowedActions: ["read", "write"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "spy-g", toolId: "tool-cron", allowedActions: ["create"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "spy-g", toolId: "tool-web-search", allowedActions: ["search"], approvalRequiredActions: [], configuration: {}, enabled: true },
  // Komunikátor
  { agentId: "communicator", toolId: "tool-gmail", allowedActions: ["read", "label", "draft", "send"], approvalRequiredActions: ["send"], configuration: {}, enabled: true },
  { agentId: "communicator", toolId: "tool-calendar", allowedActions: ["read", "create", "update", "delete"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "communicator", toolId: "tool-notify", allowedActions: ["send"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "communicator", toolId: "tool-memory", allowedActions: ["read", "write"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "communicator", toolId: "tool-cron", allowedActions: ["create"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "communicator", toolId: "tool-filesystem", allowedActions: ["read"], approvalRequiredActions: [], configuration: {}, enabled: true },
  // Developer
  { agentId: "developer", toolId: "tool-filesystem", allowedActions: ["read", "write"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "developer", toolId: "tool-github", allowedActions: ["read", "commit", "create_pr"], approvalRequiredActions: ["merge"], configuration: {}, enabled: true },
  { agentId: "developer", toolId: "tool-shell", allowedActions: ["execute"], approvalRequiredActions: ["destructive"], configuration: {}, enabled: true },
  { agentId: "developer", toolId: "tool-web-search", allowedActions: ["search"], approvalRequiredActions: [], configuration: {}, enabled: true },
  // Infrastruktura
  { agentId: "infrastructure", toolId: "tool-shell", allowedActions: ["execute"], approvalRequiredActions: ["destructive"], configuration: {}, enabled: true },
  { agentId: "infrastructure", toolId: "tool-web-search", allowedActions: ["search"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "infrastructure", toolId: "tool-cron", allowedActions: ["create", "list"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "infrastructure", toolId: "tool-filesystem", allowedActions: ["read"], approvalRequiredActions: [], configuration: {}, enabled: true },
  // Analytik
  { agentId: "analyst", toolId: "tool-web-search", allowedActions: ["search"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "analyst", toolId: "tool-filesystem", allowedActions: ["read"], approvalRequiredActions: [], configuration: {}, enabled: true },
  { agentId: "analyst", toolId: "tool-memory", allowedActions: ["read", "write"], approvalRequiredActions: [], configuration: {}, enabled: true },
];

// ─── AGENT CAPABILITIES ─────────────────────────────────────────

const agentCaps: { agentId: string; capabilityId: string }[] = [
  { agentId: "chief-of-staff", capabilityId: "cap-ai-summary" },
  { agentId: "spy-g", capabilityId: "cap-ai-summary" },
  { agentId: "communicator", capabilityId: "cap-email-triage" },
  { agentId: "communicator", capabilityId: "cap-ai-summary" },
  { agentId: "developer", capabilityId: "cap-code-search" },
  { agentId: "developer", capabilityId: "cap-git-operations" },
  { agentId: "infrastructure", capabilityId: "cap-deployment" },
  { agentId: "infrastructure", capabilityId: "cap-health-check" },
  { agentId: "analyst", capabilityId: "cap-ai-summary" },
];

// ─── INTEGRATIONS ──────────────────────────────────────────────

const allIntegrations: Integration[] = [
  { id: "int-gmail", slug: "gmail", name: "Gmail", type: "email", provider: "Google",
    description: "Gmail API", configSchema: null, status: "configured", healthStatus: "healthy", createdAt: now },
  { id: "int-calendar", slug: "calendar", name: "Google Calendar", type: "calendar", provider: "Google",
    description: "Google Calendar API", configSchema: null, status: "configured", healthStatus: "healthy", createdAt: now },
  { id: "int-github", slug: "github", name: "GitHub", type: "vcs", provider: "GitHub",
    description: "GitHub API", configSchema: null, status: "unconfigured", healthStatus: "unknown", createdAt: now },
  { id: "int-telegram", slug: "telegram", name: "Telegram", type: "messaging", provider: "Telegram",
    description: "Telegram Bot API", configSchema: null, status: "configured", healthStatus: "healthy", createdAt: now },
  { id: "int-whatsapp", slug: "whatsapp", name: "WhatsApp", type: "messaging", provider: "WhatsApp",
    description: "WhatsApp Bridge", configSchema: null, status: "configured", healthStatus: "healthy", createdAt: now },
];

// ─── SEED ──────────────────────────────────────────────────────

export function seedControlCenter(): void {
  const data: ControlCenterSeedData = {
    agents: allAgents,
    agentVersions: allAgentVersions,
    useCases: useCases,
    useCaseVersions: useCaseVersions,
    capabilities: allCapabilities,
    agentCapabilities: agentCaps,
    tools: allTools,
    agentTools: agentToolsList,
    integrations: allIntegrations,
  } as any; // departments se předají separátně

  controlCenterStore.seed(data);
  console.log(`[control-center] Seeded: ${allAgents.length} agents, ${useCases.length} use cases, ${departments.length} departments`);
}
