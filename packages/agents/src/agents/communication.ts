import type { AgentDefinition, AgentStatus, AgentTask, LiveWorkExplanation } from "@milo/shared";
import { AgentEntityImpl } from "../agent.js";
import { AgentStateMachine } from "../runtime/agent-state-machine.js";
import type { AgentEntityDeps } from "../agent.js";
import {
  DefaultCommunicationService,
  MockGmailProvider,
  MockWhatsAppProvider,
} from "../services/communication/index.js";
import type {
  Contact,
  DraftReply,
  Message,
  MessageSummary,
  Thread,
  CommunicationStats,
} from "../services/communication/types.js";

export interface CommunicationAgentState {
  messages: Message[];
  threads: Thread[];
  contacts: Contact[];
  waitingForReply: Message[];
  drafts: DraftReply[];
  stats: CommunicationStats;
  summaries: Record<string, MessageSummary>;
  lastSyncedAt?: string;
  taskProgress: number;
  activeTask?: AgentTask;
  taskHistory: AgentTask[];
  pendingQueue: AgentTask[];
}

export interface CommunicationSimulationStep {
  status: AgentStatus;
  progress: number;
  activity: string;
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
  decision: string;
  logs: string[];
}

export class CommunicationAgent extends AgentEntityImpl {
  private simulationInterval?: ReturnType<typeof setInterval>;
  private runningTick?: Promise<void>;
  private currentStepIndex = 0;
  private communicationService = new DefaultCommunicationService([
    new MockGmailProvider(),
    new MockWhatsAppProvider(),
  ]);
  private state: CommunicationAgentState = {
    messages: [],
    threads: [],
    contacts: [],
    waitingForReply: [],
    drafts: [],
    stats: {
      newMessages: 0,
      unreadMessages: 0,
      waitingForReply: 0,
      drafts: 0,
      spam: 0,
      repliedToday: 0,
      aiSuggestionsGenerated: 0,
    },
    summaries: {},
    taskProgress: 0,
    taskHistory: [],
    pendingQueue: [],
  };

  private readonly tasks: Omit<AgentTask, "id" | "createdAt">[] = [
    {
      title: "Synchronizovat komunikaci",
      description: "Načíst nové zprávy ze všech kanálů.",
      priority: "high",
      status: "pending",
      ownerId: "communication",
      ownerType: "agent",
      source: "schedule",
      log: [],
      toolsUsed: ["Communication Service", "Gmail Provider", "WhatsApp Provider"],
      citations: [],
      retryCount: 0,
      estimateMs: 30000,
    },
    {
      title: "Analyzovat důležitost zpráv",
      description: "Roztřídit zprávy podle priority a potřeby odpovědi.",
      priority: "high",
      status: "pending",
      ownerId: "communication",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Communication Service", "Priority Classifier"],
      citations: [],
      retryCount: 0,
      estimateMs: 25000,
    },
    {
      title: "Vytvořit AI shrnutí",
      description: "Shrnovat klíčové body, termíny a úkoly z důležitých zpráv.",
      priority: "normal",
      status: "pending",
      ownerId: "communication",
      ownerType: "agent",
      source: "system",
      log: [],
      toolsUsed: ["Communication Service", "AI Summary"],
      citations: [],
      retryCount: 0,
      estimateMs: 20000,
    },
    {
      title: "Připravit návrhy odpovědí",
      description: "Vygenerovat koncepty odpovědí pro zprávy čekající na reakci.",
      priority: "normal",
      status: "pending",
      ownerId: "communication",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Communication Service", "Draft Generator"],
      citations: [],
      retryCount: 0,
      estimateMs: 25000,
    },
  ];

  private readonly steps: CommunicationSimulationStep[] = [
    {
      status: "loading_messages",
      progress: 15,
      activity: "Synchronizuji komunikační kanály a načítám nové zprávy.",
      goal: "Mít aktuální přehled o všech příchozích zprávách.",
      reason: "Bez aktuálních dat nemohu třídit priority ani připravovat odpovědi.",
      findings: "Začínám synchronizaci. Zatím nemám žádné zprávy.",
      evidence: ["Gmail", "WhatsApp", "Mock ISDS"],
      toolsUsed: ["Communication Service", "Gmail Provider", "WhatsApp Provider"],
      nextStep: "Načíst seznam zpráv a kontaktů.",
      estimatedCompletion: "Za 5 sekund",
      risks: "Pokud není Gmail připojen, použiji mock data.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "99 %",
      alternativeApproach: "Pokud není dostupný žádný kanál, použiji simulované zprávy.",
      decision: "Synchronizuji přes Communication Service se všemi dostupnými providery.",
      logs: ["Začínám synchronizaci komunikace.", "Připojuji Gmail a WhatsApp providery."],
    },
    {
      status: "analyzing",
      progress: 40,
      activity: "Analyzuji obsah zpráv a určuji prioritu.",
      goal: "Roztřídit zprávy na kritické, důležité, běžné a spam.",
      reason: "Uživatel nemůže reagovat na všechny zprávy stejně rychle.",
      findings: "Našel jsem {messageCount} zpráv: {criticalCount} kritických, {importantCount} důležitých, {normalCount} běžných, {spamCount} spam.",
      evidence: ["Příchozí zprávy", "Předměty", "Tagy"],
      toolsUsed: ["Communication Service", "Priority Classifier", "Spam Filter"],
      nextStep: "Identifikovat zprávy čekající na odpověď a termíny.",
      estimatedCompletion: "Za 10 sekund",
      risks: "Mock data nemusí plně odrážet reálnou prioritu.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Synchronizace komunikace",
      confidence: "96 %",
      alternativeApproach: "Pokud není jasná priorita, označím zprávu jako důležitou až do potvrzení.",
      decision: "Kritéria priority: termíny, částky, soudní lhůty a explicitní požadavky.",
      logs: ["Třídím zprávy podle priority.", "Kontroluji spam."],
    },
    {
      status: "summarizing",
      progress: 60,
      activity: "Vytvářím AI shrnutí důležitých konverzací.",
      goal: "Extrahovat klíčové body, požadavky, termíny a úkoly.",
      reason: "Uživatel nemusí číst celé emaily, aby pochopil podstatu.",
      findings: "Shrnutí připraveno pro {importantCount} důležitých zpráv. Nalezeno {waitingCount} zpráv čekajících na odpověď.",
      evidence: ["Důležité zprávy", "Konverzace"],
      toolsUsed: ["AI Summary", "Task Extractor", "Contact Resolver"],
      nextStep: "Připravit návrhy odpovědí pro zprávy čekající na reakci.",
      estimatedCompletion: "Za 8 sekund",
      risks: "AI shrnutí může vynechat kontext – uživatel by měl ověřit důležité zprávy.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Analýza priority",
      confidence: "94 %",
      alternativeApproach: "Pokud shrnutí není dostatečné, zobrazím plný text zprávy.",
      decision: "Generuji shrnutí pro všechny zprávy s prioritou important a critical.",
      logs: ["Generuji AI shrnutí.", "Extrahuji termíny a částky."],
    },
    {
      status: "drafting_reply",
      progress: 80,
      activity: "Připravuji návrhy odpovědí.",
      goal: "Ušetřit uživateli čas při psaní odpovědí.",
      reason: "Mnoho zpráv vyžaduje podobné reakce – koncepty urychlují práci.",
      findings: "Připraveno {draftCount} konceptů odpovědí pro {waitingCount} zpráv čekajících na odpověď.",
      evidence: ["Zprávy čekající na odpověď", "Kontext konverzace"],
      toolsUsed: ["Draft Generator", "Tone Adapter", "Contact Intelligence"],
      nextStep: "Předat přehled Chief of Staff a čekat na schválení uživatele.",
      estimatedCompletion: "Za 5 sekund",
      risks: "Některé odpovědi mohou vyžadovat osobní úpravu před odesláním.",
      needsFromUser: "Schválit nebo upravit návrhy odpovědí.",
      lastCompletedStep: "AI shrnutí",
      confidence: "97 %",
      alternativeApproach: "Pokud není vhodný automatický koncept, připravím pouze shrnutí.",
      decision: "Generuji více tónů odpovědi: krátký, formální, přátelský, právní a obchodní.",
      logs: ["Připravuji koncepty odpovědí.", "Přizpůsobuji tón komunikace kontaktu."],
    },
    {
      status: "reviewing",
      progress: 95,
      activity: "Kontroluji kvalitu přehledu a konceptů.",
      goal: "Mít jistotu, že žádná důležitá zpráva neunikne.",
      reason: "Kvalita komunikace přímo ovlivňuje důvěru uživatele v agenta.",
      findings: "Přehled je připraven. {criticalCount} kritických zpráv vyžaduje pozornost.",
      evidence: ["Připravené shrnutí", "Koncepty odpovědí"],
      toolsUsed: ["Quality Check", "Communication Service"],
      nextStep: "Uložit výsledek a přejít do stavu čekání.",
      estimatedCompletion: "Za 2 sekundy",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Generování konceptů",
      confidence: "99 %",
      alternativeApproach: "Pokud přehled obsahuje neurčitosti, označím je k ověření.",
      decision: "Výstup je připraven k prezentaci.",
      logs: ["Kontroluji kvalitu shrnutí.", "Finalizuji přehled komunikace."],
    },
    {
      status: "reporting",
      progress: 100,
      activity: "Dokončuji a předávám výsledek Chief of Staff.",
      goal: "Uložit výsledek a informovat ostatní agenty.",
      reason: "Chief of Staff potřebuje komunikační přehled pro briefing.",
      findings: "Komunikace byla synchronizována, analyzována a připravena k prezentaci.",
      evidence: ["Výsledek analýzy", "Koncepty odpovědí", "Přehled kontaktů"],
      toolsUsed: ["Communication Service", "Agent Manager"],
      nextStep: "Přejít do stavu čekání na další synchronizaci.",
      estimatedCompletion: "Dokončeno",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Kontrola kvality",
      confidence: "100 %",
      alternativeApproach: "Pokud uživatel požaduje změny, upravím přehled.",
      decision: "Výsledek je hotový. Ukládám ho do paměti a historie úkolů.",
      logs: ["Přehled komunikace dokončen.", "Výsledek uložen do historie."],
    },
  ];

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async initialize(): Promise<void> {
    await super.initialize();
  }

  async start(): Promise<void> {
    await super.start();
    await this.syncCommunication();
    this.startSimulation();
  }

  async stop(): Promise<void> {
    this.stopSimulation();
    if (this.runningTick) {
      await this.runningTick.catch(() => undefined);
    }
    await super.stop();
  }

  async pause(): Promise<void> {
    this.stopSimulation();
    await super.pause();
  }

  async resume(): Promise<void> {
    await super.resume();
    this.startSimulation();
  }

  getTaskProgress(): number {
    return this.state.taskProgress;
  }

  getCommunicationState(): CommunicationAgentState {
    return this.state;
  }

  async syncCommunication(): Promise<void> {
    await this.communicationService.sync();
    this.state.messages = await this.communicationService.getMessages();
    this.state.threads = await this.communicationService.getThreads();
    this.state.contacts = await this.communicationService.getContacts();
    this.state.waitingForReply = await this.communicationService.getWaitingForReply();
    this.state.drafts = await this.communicationService.getDrafts();
    this.state.stats = await this.communicationService.getStatistics();
    this.state.lastSyncedAt = this.communicationService.getLastSyncedAt();

    for (const message of this.state.messages.filter((m) => m.priority === "critical" || m.priority === "important")) {
      try {
        const summary = await this.communicationService.summarizeMessage(message.id);
        this.state.summaries[message.id] = summary;
      } catch {
        // ignore
      }
    }

    for (const message of this.state.waitingForReply.slice(0, 3)) {
      try {
        const drafts = await this.communicationService.generateDraftReplies(message.id);
        this.state.drafts.push(...drafts);
      } catch {
        // ignore
      }
    }

    this.state.stats.aiSuggestionsGenerated = this.state.drafts.length;
  }

  private startSimulation(): void {
    if (this.simulationInterval) return;
    if (this.stopped) return;

    this.simulationInterval = setInterval(() => {
      this.runningTick = this.simulateTick().finally(() => { this.runningTick = undefined; });
    }, 4000 + Math.random() * 4000);

    this.runningTick = this.simulateTick().finally(() => { this.runningTick = undefined; });
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
  }

  private async simulateTick(): Promise<void> {
    if (this.stopped || this.status === "paused" || AgentStateMachine.isTerminal(this.status)) return;

    const activeTask = this.state.activeTask ?? this.nextTask();
    if (!activeTask) {
      await this.setIdleExplanation();
      return;
    }

    this.state.activeTask = activeTask;
    this.activeTaskId = activeTask.id;

    const step = this.steps[this.currentStepIndex];
    if (!step) {
      await this.completeTask(activeTask);
      return;
    }

    if (this.currentStepIndex === 0) {
      await this.syncCommunication();
    }

    await this.applyStep(step, activeTask);
    this.currentStepIndex += 1;
  }

  private nextTask(): AgentTask | undefined {
    if (this.state.pendingQueue.length > 0) {
      return this.state.pendingQueue.shift();
    }

    const template = this.tasks[this.state.taskHistory.length % this.tasks.length];
    if (!template) return undefined;

    return {
      ...template,
      id: `com-task-${this.state.taskHistory.length + 1}`,
      createdAt: new Date().toISOString(),
    };
  }

  private async applyStep(step: CommunicationSimulationStep, task: AgentTask): Promise<void> {
    await this.updateAgentStatus(step.status);
    this.state.taskProgress = step.progress;

    const stats = this.state.stats;
    const criticalCount = this.state.messages.filter((m) => m.priority === "critical" && !m.isSpam).length;
    const importantCount = this.state.messages.filter((m) => m.priority === "important" && !m.isSpam).length;
    const normalCount = this.state.messages.filter((m) => m.priority === "normal" && !m.isSpam).length;
    const spamCount = stats.spam;
    const waitingCount = stats.waitingForReply;
    const draftCount = this.state.drafts.length;

    const findings = step.findings
      .replace("{messageCount}", String(this.state.messages.length))
      .replace("{criticalCount}", String(criticalCount))
      .replace("{importantCount}", String(importantCount))
      .replace("{normalCount}", String(normalCount))
      .replace("{spamCount}", String(spamCount))
      .replace("{waitingCount}", String(waitingCount))
      .replace("{draftCount}", String(draftCount));

    const explanation: Partial<LiveWorkExplanation> = {
      currentActivity: step.activity,
      goal: step.goal,
      reason: step.reason,
      findings,
      evidence: step.evidence,
      toolsUsed: step.toolsUsed,
      nextStep: step.nextStep,
      estimatedCompletion: step.estimatedCompletion,
      risks: step.risks,
      needsFromUser: step.needsFromUser,
      lastCompletedStep: step.lastCompletedStep,
      confidence: step.confidence,
      alternativeApproach: step.alternativeApproach,
      decisionLog: [
        ...this.explanation.decisionLog,
        { timestamp: new Date().toISOString(), thought: step.decision },
      ].slice(-20),
    };

    this.setExplanation(explanation);

    for (const message of step.logs) {
      await this.log("info", message, { taskId: task.id, progress: step.progress });
    }

    await this.emit("agent:task:started", { taskId: task.id, progress: step.progress });
  }

  private async completeTask(task: AgentTask): Promise<void> {
    this.state.taskProgress = 100;
    this.completedTasks += 1;
    this.runningTasks = Math.max(0, this.runningTasks - 1);
    this.state.taskHistory.unshift({ ...task, status: "completed", completedAt: new Date().toISOString() });
    this.state.activeTask = undefined;
    this.activeTaskId = undefined;
    this.currentStepIndex = 0;

    await this.log("info", `Úkol dokončen: ${task.title}`, { taskId: task.id });
    await this.emit("agent:task:completed", { taskId: task.id, title: task.title });

    await this.setIdleExplanation();
  }

  private async setIdleExplanation(): Promise<void> {
    await this.updateAgentStatus("idle");
    this.state.taskProgress = 0;
    this.setExplanation({
      currentActivity: "Čekám na novou komunikaci nebo instrukci.",
      goal: "Být připraven okamžitě reagovat na nové zprávy.",
      reason: "Communication Agent musí být vždy připraven hlídat příchozí komunikaci.",
      findings: `Synchronizováno ${this.state.messages.length} zpráv. ${this.state.stats.waitingForReply} čeká na odpověď, ${this.state.drafts.length} AI konceptů připraveno, ${this.state.contacts.length} kontaktů v Relationship Intelligence.`,
      evidence: ["Gmail", "WhatsApp", "Kontakty", "Knowledge Index"],
      toolsUsed: ["Communication Service", "AI Summary", "Draft Generator"],
      nextStep: "Synchronizovat komunikaci nebo reagovat na nový požadavek.",
      estimatedCompletion: "Neurčito",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: this.state.taskHistory[0]?.title ?? "Žádný",
      confidence: "100 %",
      alternativeApproach: "Pokud není nová komunikace, provedu pravidelnou synchronizaci podle plánu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
