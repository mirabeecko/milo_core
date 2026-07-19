import type { AgentDefinition, AgentTask, LiveWorkExplanation } from "@milo/shared";
import type { AiMessage } from "@milo/ai";
import { CalendarClient } from "@milo/tools";
import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import {
  DefaultCalendarService,
  GoogleCalendarProvider,
  MockCalendarProvider,
} from "../services/calendar/index.js";
import type {
  Calendar,
  CalendarEvent,
  CalendarProvider,
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
  isDemoData?: boolean;
}

export class CalendarAgent extends AgentEntityImpl {
  private calendarService = new DefaultCalendarService(new MockCalendarProvider());
  private isDemoData = true;
  private state: CalendarAgentState = {
    calendars: [],
    todayEvents: [],
    conflicts: [],
    suggestions: [],
    upcoming: [],
    taskProgress: 0,
  };

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async initialize(): Promise<void> {
    await super.initialize();
  }

  async start(): Promise<void> {
    await super.start();

    this.setExplanation({
      currentActivity: "Synchronizuji kalendáře a načítám události.",
      goal: "Mít aktuální data ze všech připojených kalendářů.",
      reason: "Bez aktuálních dat nemohu plánovat ani detekovat kolize.",
      findings: "Začínám synchronizaci.",
      evidence: ["Google Calendar", "Mock Provider"],
      toolsUsed: ["Calendar Service", "Mock Provider"],
      nextStep: "Načíst seznam kalendářů a událostí na dnešek.",
      estimatedCompletion: "Za několik sekund",
      risks: "Pokud OAuth není nastaveno, použiji mock data.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Inicializace",
      confidence: "99 %",
      alternativeApproach: "Pokud není dostupný Google Calendar, použiji lokální mock provider.",
    });

    try {
      await this.syncCalendar();
    } catch (err) {
      console.warn({ err }, "Initial calendar sync failed, using mock provider");
    }

    await this.runAIAnalysis();

    this.setIdleExplanation();
    await this.transitionTo("idle");
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  async pause(): Promise<void> {
    await super.pause();
  }

  async resume(): Promise<void> {
    await super.resume();
  }

  getTaskProgress(): number {
    return this.state.taskProgress;
  }

  getCalendarState(): CalendarAgentState {
    return { ...this.state, isDemoData: this.isDemoData };
  }

  async runTask(task: AgentTask): Promise<void> {
    if (this.status === "offline") {
      throw new Error(`Agent ${this.id} is offline`);
    }

    const startedAt = Date.now();
    this.activeTaskId = task.id;
    this.runningTasks += 1;
    this.state.taskProgress = 0;
    await this.transitionTo("working");
    this.agent.metrics.totalTasks += 1;

    await this.log("info", `Spouštím kalendářní úkol: ${task.title}`, { taskId: task.id });

    this.setExplanation({
      currentActivity: `Spouštím úkol: ${task.title}`,
      goal: task.description ?? "Dokončit zadaný úkol",
      reason: `Přijal jsem úkol od ${task.ownerType} ${task.ownerId}`,
      findings: "Zatím začínám.",
      evidence: ["interní fronta úkolů"],
      toolsUsed: this.agent.config.tools.slice(0, 3),
      nextStep: "Synchronizovat kalendář a spustit AI analýzu.",
      estimatedCompletion: "Za několik sekund",
      risks: "Žádné známé riziko.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });

    try {
      await this.syncCalendar();
      this.state.taskProgress = 50;

      const result = await this.runAIAnalysis();
      this.state.taskProgress = 100;

      const completedAt = new Date().toISOString();
      this.completedTasks += 1;
      this.agent.metrics.successfulTasks += 1;
      this.consecutiveErrors = 0;

      await this.log("info", `Úkol dokončen: ${task.title}`, { taskId: task.id, output: result });
      this.setExplanation({
        currentActivity: "Úkol dokončen.",
        findings: `Úkol ${task.title} byl úspěšně dokončen.`,
        lastCompletedStep: `Dokončil jsem úkol ${task.title}`,
      });
    } catch (error) {
      this.failedTasks += 1;
      this.agent.metrics.failedTasks += 1;
      this.agent.metrics.errorCount += 1;
      this.consecutiveErrors += 1;
      this.state.taskProgress = 0;

      const message = error instanceof Error ? error.message : String(error);
      await this.log("error", `Úkol selhal: ${message}`, { taskId: task.id });
      this.setExplanation({
        currentActivity: "Úkol selhal.",
        findings: `Úkol ${task.title} selhal: ${message}`,
      });

      if (this.consecutiveErrors >= this.deps.config.maxConsecutiveErrors) {
        await this.transitionTo("error");
      }
    } finally {
      this.runningTasks = Math.max(0, this.runningTasks - 1);
      this.activeTaskId = undefined;
      this.state.taskProgress = 0;
      if (this.status !== "paused" && this.status !== "error") {
        await this.transitionTo("idle");
      }
    }

    const actualTimeMs = Date.now() - startedAt;
    if (this.agent.metrics.averageDurationMs === 0) {
      this.agent.metrics.averageDurationMs = actualTimeMs;
    } else {
      const total = this.agent.metrics.successfulTasks + this.agent.metrics.failedTasks;
      this.agent.metrics.averageDurationMs = Math.round(
        (this.agent.metrics.averageDurationMs * (total - 1) + actualTimeMs) / total,
      );
    }
    this.agent.metrics.lastUpdatedAt = new Date().toISOString();
  }

  private async resolveProvider(): Promise<CalendarProvider> {
    const googleAuth = this.deps.googleAuth;
    if (googleAuth?.isConfigured) {
      const tokens = await googleAuth.getTokens("calendar");
      if (tokens) {
        const client = new CalendarClient({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          clientId: googleAuth.clientId,
          clientSecret: googleAuth.clientSecret,
          onTokensRefreshed: (refreshed) => void googleAuth.saveTokens("calendar", refreshed),
        });
        this.isDemoData = false;
        return new GoogleCalendarProvider(client);
      }
    }
    this.isDemoData = true;
    return new MockCalendarProvider();
  }

  async syncCalendar(): Promise<void> {
    try {
      this.calendarService = new DefaultCalendarService(
        this.isDemoData ? new MockCalendarProvider() : await this.resolveProvider(),
      );
      await this.calendarService.sync();
    } catch (err) {
      if (!this.isDemoData) {
        console.warn("Calendar sync failed, falling back to mock provider:", err);
        this.isDemoData = true;
        this.calendarService = new DefaultCalendarService(new MockCalendarProvider());
        await this.calendarService.sync();
      } else {
        throw err;
      }
    }
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

  private async runAIAnalysis(): Promise<string> {
    if (!this.deps.aiRouter) {
      const fallback = this.buildFallbackSummary();
      this.setExplanation({
        currentActivity: "AI není nakonfigurováno. Používám data z kalendáře bez AI analýzy.",
        findings: fallback,
        nextStep: "Nakonfigurujte ModelRouter pro AI analýzu kalendáře.",
      });
      return `[AI není nakonfigurováno]\n\n${fallback}`;
    }

    this.setExplanation({
      currentActivity: "Analyzuji den pomocí AI.",
      nextStep: "Komunikuji s jazykovým modelem.",
    });

    try {
      const provider = this.deps.aiRouter.getProvider("analyze");
      const today = new Date().toISOString().split("T")[0] ?? "dnes";
      const eventList = this.state.todayEvents
        .map((e) => `- ${e.summary ?? "Bez názvu"}: ${e.start ?? "?"}–${e.end ?? "?"}`)
        .join("\n");

      const analysis = this.state.analysis;
      const content = [
        `Datum: ${today}`,
        `Počet událostí: ${this.state.todayEvents.length}`,
        `Přetížený den: ${analysis?.overloaded ? "ano" : "ne"}`,
        `Skóre produktivity: ${analysis?.productivityScore ?? "?"} %`,
        `Počet kolizí: ${this.state.conflicts.length}`,
        `Počet doporučení: ${this.state.suggestions.length}`,
        ``,
        `Události:`,
        eventList || "Žádné události",
      ].join("\n");

      const messages: AiMessage[] = [
        {
          role: "system",
          content:
            "Jsi kalendářový analytik. Analyzuj dnešní den uživatele: vyhodnoť vytížení, identifikuj kolize a volné bloky, navrhni focus time a deep work. Odpovídej česky, stručně a strukturovaně.",
        },
        { role: "user", content },
      ];

      const result = await provider.complete(messages, { temperature: 0.3 });

      this.setExplanation({
        currentActivity: "AI analýza dokončena.",
        findings: `AI analýza dne ${today} dokončena. ${this.state.conflicts.length} kolizí nalezeno.`,
        nextStep: "Čekám na další instrukce.",
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const fallback = this.buildFallbackSummary();
      this.setExplanation({
        currentActivity: "AI analýza selhala, používám fallback.",
        findings: `Chyba: ${message}. ${fallback}`,
        nextStep: "Zkontrolujte AI připojení.",
      });
      return `[AI dočasně nedostupné: ${message}]\n\n${fallback}`;
    }
  }

  private buildFallbackSummary(): string {
    const today = new Date().toISOString().split("T")[0] ?? "dnes";
    const eventCount = this.state.todayEvents.length;
    const conflictCount = this.state.conflicts.length;
    const suggestionCount = this.state.suggestions.length;
    const analysis = this.state.analysis;
    const overloaded = analysis?.overloaded ? "přetížený" : "v normě";
    const productivityScore = analysis?.productivityScore ?? "?";

    return [
      `Shrnutí dne ${today} (bez AI):`,
      `- Synchronizováno ${this.state.calendars.length} kalendářů`,
      `- ${eventCount} událostí dnes`,
      `- Den je ${overloaded}`,
      `- Produktivní skóre: ${productivityScore} %`,
      `- ${conflictCount} kolizí`,
      `- ${suggestionCount} doporučení`,
      this.isDemoData ? "- Kalendář není připojen. Připojte Google Calendar pro reálná data." : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private setIdleExplanation(): void {
    this.state.taskProgress = 0;
    this.setExplanation({
      currentActivity: "Čekám na další synchronizaci nebo instrukci.",
      goal: "Být připraven okamžitě reagovat na změny v kalendáři.",
      reason: "Calendar Agent musí být vždy připraven hlídat čas uživatele.",
      findings: `Synchronizováno ${this.state.calendars.length} kalendářů, ${this.state.todayEvents.length} událostí dnes, ${this.state.conflicts.length} kolizí, ${this.state.suggestions.length} doporučení.${this.isDemoData ? " Kalendář není připojen. Připojte Google Calendar pro reálná data." : " (reálná data z Google Kalendáře)"}`,
      evidence: ["Kalendáře", "Dnešní události", "Analýza dne"],
      toolsUsed: this.isDemoData ? ["Calendar Service", "Mock Provider"] : ["Calendar Service", "Google Calendar API"],
      nextStep: "Synchronizovat kalendář nebo reagovat na nový požadavek.",
      estimatedCompletion: "Neurčito",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Synchronizace kalendáře",
      confidence: "100 %",
      alternativeApproach: "Pokud není nový požadavek, provedu pravidelnou synchronizaci podle plánu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
