import type { AgentDefinition, AgentStatus, AgentTask, LiveWorkExplanation } from "@milo/shared";
import { AgentEntityImpl } from "../agent.js";
import { AgentStateMachine } from "../runtime/agent-state-machine.js";
import type { AgentEntityDeps } from "../agent.js";
import {
  DefaultCalendarService,
  MockCalendarProvider,
} from "../services/calendar/index.js";
import type {
  Calendar,
  CalendarEvent,
  CalendarSuggestion,
  Conflict,
  DayAnalysis,
} from "../services/calendar/types.js";

export interface CalendarAgentState {
  calendars: Calendar[];
  todayEvents: CalendarEvent[];
  analysis?: DayAnalysis;
  conflicts: Conflict[];
  suggestions: CalendarSuggestion[];
  upcoming: CalendarEvent[];
  lastSyncedAt?: string;
  taskProgress: number;
}

export interface CalendarSimulationStep {
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

export class CalendarAgent extends AgentEntityImpl {
  private simulationInterval?: ReturnType<typeof setInterval>;
  private runningTick?: Promise<void>;
  private currentStepIndex = 0;
  private calendarService = new DefaultCalendarService(new MockCalendarProvider());
  private state: CalendarAgentState & { activeTask?: AgentTask; taskHistory: AgentTask[]; pendingQueue: AgentTask[] } = {
    calendars: [],
    todayEvents: [],
    conflicts: [],
    suggestions: [],
    upcoming: [],
    taskProgress: 0,
    taskHistory: [],
    pendingQueue: [],
  };

  private readonly tasks: Omit<AgentTask, "id" | "createdAt">[] = [
    {
      title: "Synchronizovat kalendář",
      description: "Načíst aktuální události z připojených kalendářů.",
      priority: "high",
      status: "pending",
      ownerId: "calendar",
      ownerType: "agent",
      source: "schedule",
      log: [],
      toolsUsed: ["Calendar Service", "Mock Provider"],
      citations: [],
      retryCount: 0,
      estimateMs: 30000,
    },
    {
      title: "Analyzovat dnešní den",
      description: "Vyhodnotit vytížení, focus time a kolize.",
      priority: "high",
      status: "pending",
      ownerId: "calendar",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Calendar Service", "Analytics"],
      citations: [],
      retryCount: 0,
      estimateMs: 25000,
    },
    {
      title: "Najít kolize a volné bloky",
      description: "Identifikovat překrývající se události a navrhnout řešení.",
      priority: "normal",
      status: "pending",
      ownerId: "calendar",
      ownerType: "agent",
      source: "system",
      log: [],
      toolsUsed: ["Calendar Service", "Conflict Detector"],
      citations: [],
      retryCount: 0,
      estimateMs: 20000,
    },
    {
      title: "Generovat doporučení",
      description: "Vytvořit chytré návrhy pro optimalizaci dne.",
      priority: "normal",
      status: "pending",
      ownerId: "calendar",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Calendar Service", "Suggestion Engine"],
      citations: [],
      retryCount: 0,
      estimateMs: 20000,
    },
  ];

  private readonly steps: CalendarSimulationStep[] = [
    {
      status: "loading_calendar",
      progress: 15,
      activity: "Synchronizuji kalendáře a načítám události.",
      goal: "Mít aktuální data ze všech připojených kalendářů.",
      reason: "Bez aktuálních dat nemohu plánovat ani detekovat kolize.",
      findings: "Začínám synchronizaci. Zatím nemám žádné události.",
      evidence: ["Google Calendar", "Mock Provider"],
      toolsUsed: ["Calendar Service", "Mock Provider"],
      nextStep: "Načíst seznam kalendářů a událostí na dnešek.",
      estimatedCompletion: "Za 5 sekund",
      risks: "Pokud OAuth není nastaveno, použiji mock data.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "99 %",
      alternativeApproach: "Pokud není dostupný Google Calendar, použiji lokální mock provider.",
      decision: "Synchronizuji přes Calendar Service, který automaticky volí dostupného providera.",
      logs: ["Začínám synchronizaci kalendáře.", "Připojuji se k dostupnému provideru."],
    },
    {
      status: "analyzing",
      progress: 40,
      activity: "Analyzuji dnešní plán a vyhodnocuji vytížení.",
      goal: "Zjistit, jak je den vytížený a kde jsou volné bloky.",
      reason: "Uživatel potřebuje přehled, zda má den správné rozložení.",
      findings: "Načteno {eventCount} událostí. Den je {overloaded}.",
      evidence: ["Dnešní události", "Kalendáře"],
      toolsUsed: ["Calendar Service", "Day Analyzer"],
      nextStep: "Vyhodnotit focus time, deep work a přestávky.",
      estimatedCompletion: "Za 10 sekund",
      risks: "Mock data nemusí plně odpovídat reálnému kalendáři.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Synchronizace kalendáře",
      confidence: "96 %",
      alternativeApproach: "Pokud chybí data, navrhnu strukturovaný plán bez konkrétních událostí.",
      decision: "Použiji dnešní datum jako základ analýzy.",
      logs: ["Načítám dnešní události.", "Počítám celkový čas schůzek."],
    },
    {
      status: "analyzing",
      progress: 60,
      activity: "Kontroluji kolize a hledám volné termíny.",
      goal: "Odhalit konflikty a nabídnout řešení.",
      reason: "Kolize mohou způsobit zmeškané schůzky a zmatek.",
      findings: "Nalezeno {conflictCount} kolizí a {freeSlotCount} vhodných volných bloků.",
      evidence: ["Dnešní události", "Conflict Detector"],
      toolsUsed: ["Calendar Service", "Conflict Detector", "Free Slot Finder"],
      nextStep: "Generovat konkrétní doporučení pro uživatele.",
      estimatedCompletion: "Za 8 sekund",
      risks: "Překrývající se události vyžadují ruční potvrzení přesunu.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Analýza vytížení",
      confidence: "94 %",
      alternativeApproach: "Pokud nelze najít volný slot, navrhnu přesun na jiný den.",
      decision: "Kritické kolize řeším jako první, pak volné bloky.",
      logs: ["Kontroluji překrývající se události.", "Hledám volné bloky pro focus time."],
    },
    {
      status: "scheduling",
      progress: 80,
      activity: "Připravuji doporučení a optimalizuji plán.",
      goal: "Vytvořit akcionabilní návrhy pro lepší rozložení dne.",
      reason: "Doporučení šetří čas a zlepšují produktivitu.",
      findings: "Připraveno {suggestionCount} doporučení včetně focus time a řešení kolizí.",
      evidence: ["Analýza dne", "Nalezené kolize", "Volne bloky"],
      toolsUsed: ["Calendar Service", "Suggestion Engine"],
      nextStep: "Předat výsledek Chief of Staff a zobrazit v dashboardu.",
      estimatedCompletion: "Za 5 sekund",
      risks: "Některá doporučení mohou vyžadovat potvrzení uživatele.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Detekce kolizí",
      confidence: "97 %",
      alternativeApproach: "Pokud uživatel má vlastní preference, upřednostním je před automatickým návrhem.",
      decision: "Navrhuji přesun kolize, rezervaci focus time a deep work.",
      logs: ["Generuji doporučení.", "Kontroluji preference uživatele."],
    },
    {
      status: "reviewing",
      progress: 95,
      activity: "Kontroluji kvalitu plánu a finalizuji výstup.",
      goal: "Mít jistotu, že plán je konzistentní a užitečný.",
      reason: "Nechci uživateli navrhnout plán, který by mu spíše uškodil.",
      findings: "Plán je připraven. Produktivní skóre dne je {productivityScore} %.",
      evidence: ["Finalizovaný plán", "Doporučení"],
      toolsUsed: ["Calendar Service", "Quality Check"],
      nextStep: "Uložit výsledek a přejít do stavu čekání.",
      estimatedCompletion: "Za 2 sekundy",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Generování doporučení",
      confidence: "99 %",
      alternativeApproach: "Pokud skóre je nízké, navrhnu další úpravy.",
      decision: "Výstup je připraven k prezentaci.",
      logs: ["Kontroluji kvalitu plánu.", "Finalizuji výstup."],
    },
    {
      status: "reporting",
      progress: 100,
      activity: "Dokončuji a předávání výsledek.",
      goal: "Uložit výsledek a informovat Chief of Staff.",
      reason: "Uživatel a ostatní agenti musí mít přístup k aktuálnímu plánu.",
      findings: "Kalendář byl synchronizován a analyzován. Doporučení jsou připravena.",
      evidence: ["Výsledek analýzy", "Doporučení"],
      toolsUsed: ["Calendar Service", "Agent Manager"],
      nextStep: "Přejít do stavu čekání na další synchronizaci.",
      estimatedCompletion: "Dokončeno",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Kontrola kvality",
      confidence: "100 %",
      alternativeApproach: "Pokud uživatel požaduje změny, upravím plán.",
      decision: "Výsledek je hotový. Ukládám ho do paměti a historie úkolů.",
      logs: ["Analýza dokončena.", "Výsledek uložen do historie."],
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
    await this.calendarService.sync();
    this.startSimulation();
  }

  async stop(): Promise<void> {
    this.stopSimulation();
    this.runningTick?.catch(() => undefined);
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

  getTaskHistory(): AgentTask[] {
    return this.state.taskHistory;
  }

  getPendingQueue(): AgentTask[] {
    return this.state.pendingQueue;
  }

  getCalendarState(): CalendarAgentState {
    return this.state;
  }

  async syncCalendar(): Promise<void> {
    await this.calendarService.sync();
    this.state.calendars = this.calendarService.getCalendars();
    this.state.lastSyncedAt = this.calendarService.getLastSyncedAt();
    const today = new Date().toISOString().split("T")[0];
    if (today) {
      this.state.analysis = await this.calendarService.analyzeDay(today);
      this.state.conflicts = await this.calendarService.findConflicts(today);
      this.state.suggestions = await this.calendarService.getSuggestions(today);
    }
    this.state.todayEvents = await this.calendarService.listEvents({
      from: new Date().toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    });
    this.state.upcoming = await this.calendarService.getUpcoming(10);
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
      await this.syncCalendar();
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
      id: `cal-task-${this.state.taskHistory.length + 1}`,
      createdAt: new Date().toISOString(),
    };
  }

  private async applyStep(step: CalendarSimulationStep, task: AgentTask): Promise<void> {
    await this.updateAgentStatus(step.status);
    this.state.taskProgress = step.progress;

    const today = new Date().toISOString().split("T")[0] ?? "";
    const analysis = this.state.analysis;
    const freeSlots = today ? await this.calendarService.findFreeSlots(today, 60) : [];

    const findings = step.findings
      .replace("{eventCount}", String(this.state.todayEvents.length))
      .replace("{overloaded}", analysis?.overloaded ? "přetížený" : "v normě")
      .replace("{conflictCount}", String(this.state.conflicts.length))
      .replace("{freeSlotCount}", String(freeSlots.length))
      .replace("{suggestionCount}", String(this.state.suggestions.length))
      .replace("{productivityScore}", String(analysis?.productivityScore ?? 0));

    const nextStep = step.nextStep.replace("{freeSlotCount}", String(freeSlots.length));

    const explanation: Partial<LiveWorkExplanation> = {
      currentActivity: step.activity,
      goal: step.goal,
      reason: step.reason,
      findings,
      evidence: step.evidence,
      toolsUsed: step.toolsUsed,
      nextStep,
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
      currentActivity: "Čekám na další synchronizaci nebo instrukci.",
      goal: "Být připraven okamžitě reagovat na změny v kalendáři.",
      reason: "Calendar Agent musí být vždy připraven hlídat čas uživatele.",
      findings: `Synchronizováno ${this.state.calendars.length} kalendářů, ${this.state.todayEvents.length} událostí dnes, ${this.state.conflicts.length} kolizí, ${this.state.suggestions.length} doporučení.`,
      evidence: ["Kalendáře", "Dnešní události", "Analýza dne"],
      toolsUsed: ["Calendar Service", "Mock Provider"],
      nextStep: "Synchronizovat kalendář nebo reagovat na nový požadavek.",
      estimatedCompletion: "Neurčito",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: this.state.taskHistory[0]?.title ?? "Žádný",
      confidence: "100 %",
      alternativeApproach: "Pokud není nový požadavek, provedu pravidelnou synchronizaci podle plánu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
