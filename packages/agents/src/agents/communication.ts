import type { AgentDefinition, AgentTask, LiveWorkExplanation } from "@milo/shared";
import type { AiMessage } from "@milo/ai";
import { GmailClient } from "@milo/tools";
import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import {
  DefaultCommunicationService,
  GoogleGmailProvider,
  MockGmailProvider,
  MockWhatsAppProvider,
} from "../services/communication/index.js";
import type {
  CommunicationProvider,
  Contact,
  DraftReply,
  Message,
  MessageSummary,
  Thread,
  CommunicationStats,
} from "../services/communication/types.js";

export interface SecretaryAgentState {
  messages: Message[];
  threads: Thread[];
  contacts: Contact[];
  waitingForReply: Message[];
  drafts: DraftReply[];
  stats: CommunicationStats;
  summaries: Record<string, MessageSummary>;
  lastSyncedAt?: string;
  taskProgress: number;
  isDemoData?: boolean;
}

export class SecretaryAgent extends AgentEntityImpl {
  private communicationService = new DefaultCommunicationService([
    new MockGmailProvider(),
    new MockWhatsAppProvider(),
  ]);
  private isDemoData = true;
  private state: SecretaryAgentState = {
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
      currentActivity: "Synchronizuji komunikační kanály a načítám nové zprávy.",
      goal: "Mít aktuální přehled o všech příchozích zprávách.",
      reason: "Bez aktuálních dat nemohu třídit priority ani připravovat odpovědi.",
      findings: "Začínám synchronizaci.",
      evidence: ["Gmail", "WhatsApp", "Mock ISDS"],
      toolsUsed: ["Communication Service", "Gmail Provider", "WhatsApp Provider"],
      nextStep: "Načíst seznam zpráv a kontaktů.",
      estimatedCompletion: "Za několik sekund",
      risks: "Pokud není Gmail připojen, použiji mock data.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Inicializace",
      confidence: "99 %",
      alternativeApproach: "Pokud není dostupný žádný kanál, použiji simulované zprávy.",
    });

    try {
      await this.syncSecretary();
    } catch (err) {
      console.warn({ err }, "Initial communication sync failed, using mock provider");
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

  getSecretaryState(): SecretaryAgentState {
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

    await this.log("info", `Spouštím komunikační úkol: ${task.title}`, { taskId: task.id });

    this.setExplanation({
      currentActivity: `Spouštím úkol: ${task.title}`,
      goal: task.description ?? "Dokončit zadaný úkol",
      reason: `Přijal jsem úkol od ${task.ownerType} ${task.ownerId}`,
      findings: "Zatím začínám.",
      evidence: ["interní fronta úkolů"],
      toolsUsed: this.agent.config.tools.slice(0, 3),
      nextStep: "Synchronizovat komunikaci a spustit AI analýzu.",
      estimatedCompletion: "Za několik sekund",
      risks: "Žádné známé riziko.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });

    try {
      await this.syncSecretary();
      this.state.taskProgress = 50;

      const result = await this.runAIAnalysis();
      this.state.taskProgress = 100;

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

  private async resolveProviders(): Promise<CommunicationProvider[]> {
    const googleAuth = this.deps.googleAuth;
    if (googleAuth?.isConfigured) {
      const tokens = await googleAuth.getTokens("email");
      if (tokens) {
        const client = new GmailClient({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          clientId: googleAuth.clientId,
          clientSecret: googleAuth.clientSecret,
          onTokensRefreshed: (refreshed) => void googleAuth.saveTokens("email", refreshed),
        });
        this.isDemoData = false;
        return [new GoogleGmailProvider(client), new MockWhatsAppProvider()];
      }
    }
    this.isDemoData = true;
    return [new MockGmailProvider(), new MockWhatsAppProvider()];
  }

  async syncSecretary(): Promise<void> {
    try {
      this.communicationService = new DefaultCommunicationService(
        this.isDemoData ? [new MockGmailProvider(), new MockWhatsAppProvider()] : await this.resolveProviders(),
      );
      await this.communicationService.sync();
    } catch (err) {
      if (!this.isDemoData) {
        console.warn("Communication sync failed, falling back to mock provider:", err);
        this.isDemoData = true;
        this.communicationService = new DefaultCommunicationService([
          new MockGmailProvider(),
          new MockWhatsAppProvider(),
        ]);
        await this.communicationService.sync();
      } else {
        throw err;
      }
    }
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

  private async runAIAnalysis(): Promise<string> {
    if (!this.deps.aiRouter) {
      const fallback = this.buildFallbackSummary();
      this.setExplanation({
        currentActivity: "AI není nakonfigurováno. Používám data bez AI analýzy.",
        findings: fallback,
        nextStep: "Nakonfigurujte ModelRouter pro AI analýzu komunikace.",
      });
      return `[AI není nakonfigurováno]\n\n${fallback}`;
    }

    this.setExplanation({
      currentActivity: "Analyzuji komunikaci pomocí AI.",
      nextStep: "Komunikuji s jazykovým modelem.",
    });

    try {
      const provider = this.deps.aiRouter.getProvider("summarize");
      const criticalCount = this.state.messages.filter((m) => m.priority === "critical" && !m.isSpam).length;
      const importantCount = this.state.messages.filter((m) => m.priority === "important" && !m.isSpam).length;

      const messageList = this.state.messages
        .filter((m) => !m.isSpam)
        .map((m) => `- [${m.priority}] ${m.subject ?? "Bez předmětu"} (od: ${m.from ?? "?"})`)
        .join("\n");

      const content = [
        `Počet nových zpráv: ${this.state.stats.newMessages}`,
        `Nepřečtených: ${this.state.stats.unreadMessages}`,
        `Čeká na odpověď: ${this.state.stats.waitingForReply}`,
        `Spam: ${this.state.stats.spam}`,
        `Kritických: ${criticalCount}`,
        `Důležitých: ${importantCount}`,
        `Návrhů odpovědí: ${this.state.drafts.length}`,
        ``,
        `Zprávy:`,
        messageList || "Žádné zprávy",
      ].join("\n");

      const messages: AiMessage[] = [
        {
          role: "system",
          content:
            "Jsi komunikační asistent. Proveď analýzu příchozí komunikace: roztřiď zprávy podle priority, shrň klíčové body z důležitých zpráv, navrhni které zprávy vyžadují okamžitou odpověď a připrav stručné shrnutí. Odpovídej česky, stručně a strukturovaně.",
        },
        { role: "user", content },
      ];

      const result = await provider.complete(messages, { temperature: 0.3 });

      this.setExplanation({
        currentActivity: "AI analýza komunikace dokončena.",
        findings: `Analyzováno ${this.state.messages.length} zpráv. ${this.state.stats.waitingForReply} čeká na odpověď.`,
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
    const criticalCount = this.state.messages.filter((m) => m.priority === "critical" && !m.isSpam).length;
    const importantCount = this.state.messages.filter((m) => m.priority === "important" && !m.isSpam).length;

    return [
      `Přehled komunikace (bez AI):`,
      `- ${this.state.messages.length} zpráv celkem`,
      `- ${criticalCount} kritických`,
      `- ${importantCount} důležitých`,
      `- ${this.state.stats.waitingForReply} čeká na odpověď`,
      `- ${this.state.drafts.length} AI konceptů odpovědí`,
      `- ${this.state.stats.spam} spam`,
      `- ${this.state.contacts.length} kontaktů`,
      this.isDemoData ? "- Gmail není připojen. Připojte účet pro reálná data." : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private setIdleExplanation(): void {
    this.state.taskProgress = 0;
    this.setExplanation({
      currentActivity: "Čekám na novou komunikaci nebo instrukci.",
      goal: "Být připraven okamžitě reagovat na nové zprávy.",
      reason: "Secretary musí být vždy připraven hlídat příchozí komunikaci.",
      findings: `Synchronizováno ${this.state.messages.length} zpráv. ${this.state.stats.waitingForReply} čeká na odpověď, ${this.state.drafts.length} AI konceptů připraveno, ${this.state.contacts.length} kontaktů v Relationship Intelligence.${this.isDemoData ? " Gmail není připojen. Připojte účet pro reálná data." : " (reálná data z Gmailu; WhatsApp zůstává demo, integrace zatím neexistuje)"}`,
      evidence: ["Gmail", "WhatsApp", "Kontakty", "Knowledge Index"],
      toolsUsed: this.isDemoData ? ["Communication Service", "Mock Provider"] : ["Communication Service", "Gmail API"],
      nextStep: "Synchronizovat komunikaci nebo reagovat na nový požadavek.",
      estimatedCompletion: "Neurčito",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Synchronizace komunikace",
      confidence: "100 %",
      alternativeApproach: "Pokud není nová komunikace, provedu pravidelnou synchronizaci podle plánu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
