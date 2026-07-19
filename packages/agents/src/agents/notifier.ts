import type { AgentDefinition, AgentTask, LiveWorkExplanation } from "@milo/shared";
import type { AiMessage } from "@milo/ai";
import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import { DefaultNotifierService } from "../services/notifier/index.js";
import type { NotifierAgentState, ReminderItem } from "../services/notifier/types.js";

export class NotifierAgent extends AgentEntityImpl {
  private notifierService = new DefaultNotifierService();
  private state: NotifierAgentState = {
    reminders: [],
    todayDate: new Date().toISOString().split("T")[0]!,
    taskProgress: 0,
  };

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.notifierService.load();
    this.state.todayDate = new Date().toISOString().split("T")[0]!;
    this.state.reminders = this.notifierService.getTodayReminders();
  }

  async start(): Promise<void> {
    await super.start();

    this.setExplanation({
      currentActivity: "Synchronizuji připomínky z kalendáře, úkolů a emailů.",
      goal: "Mít aktuální seznam všech připomínek na dnešek.",
      reason: "Bez aktuálních dat nemohu správně notifikovat uživatele.",
      findings: "Začínám synchronizaci.",
      evidence: ["Calendar Service", "Task Service", "Email Service"],
      toolsUsed: ["Notifier Service"],
      nextStep: "Vytvořit položky pro dnešní události.",
      estimatedCompletion: "Za několik sekund",
      risks: "Pokud nejsou data z kalendáře, použiji pouze úkoly a emaily.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Inicializace",
      confidence: "99 %",
      alternativeApproach: "Pokud selže synchronizace, načtu poslední uložená data.",
    });

    try {
      await this.notifierService.load();
    } catch (err) {
      console.warn({ err }, "Initial notifier load failed");
    }

    this.state.todayDate = new Date().toISOString().split("T")[0]!;
    this.state.reminders = this.notifierService.getAllReminders();

    await this.runNotifierCheck();

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

  getNotifierState(): NotifierAgentState {
    return {
      reminders: this.state.reminders,
      todayDate: this.state.todayDate,
      lastCheckAt: this.state.lastCheckAt,
      taskProgress: this.state.taskProgress,
    };
  }

  async syncNotifier(): Promise<NotifierAgentState> {
    const today = new Date().toISOString().split("T")[0]!;
    this.state.todayDate = today;

    await this.notifierService.syncReminders([], [], []);
    this.state.reminders = this.notifierService.getTodayReminders();

    return this.getNotifierState();
  }

  async selectReminderOption(id: string, option: string): Promise<ReminderItem | null> {
    const updated = await this.notifierService.selectReminderOption(id, option);
    if (updated) {
      const idx = this.state.reminders.findIndex((r) => r.id === id);
      if (idx !== -1) {
        this.state.reminders[idx] = updated;
      }
      return updated;
    }
    return null;
  }

  async dismissReminder(id: string): Promise<ReminderItem | null> {
    const updated = await this.notifierService.dismissReminder(id);
    if (updated) {
      const idx = this.state.reminders.findIndex((r) => r.id === id);
      if (idx !== -1) {
        this.state.reminders[idx] = updated;
      }
      return updated;
    }
    return null;
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

    await this.log("info", `Spouštím notifikační úkol: ${task.title}`, { taskId: task.id });

    this.setExplanation({
      currentActivity: `Spouštím úkol: ${task.title}`,
      goal: task.description ?? "Dokončit zadaný úkol",
      reason: `Přijal jsem úkol od ${task.ownerType} ${task.ownerId}`,
      findings: "Zatím začínám.",
      evidence: ["interní fronta úkolů"],
      toolsUsed: this.agent.config.tools.slice(0, 3),
      nextStep: "Synchronizovat připomínky a spustit AI analýzu.",
      estimatedCompletion: "Za několik sekund",
      risks: "Žádné známé riziko.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });

    try {
      await this.runNotifierCheck();
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

  private async runNotifierCheck(): Promise<void> {
    const result = this.notifierService.checkReminders(new Date());
    this.state.lastCheckAt = result.checkTime;

    for (const reminder of result.triggered) {
      reminder.status = "notified";
      await this.notifierService.save();
    }

    this.state.reminders = this.notifierService.getTodayReminders();
  }

  private async runAIAnalysis(): Promise<string> {
    if (!this.deps.aiRouter) {
      const fallback = this.buildFallbackSummary();
      this.setExplanation({
        currentActivity: "AI není nakonfigurováno. Používám data bez AI analýzy.",
        findings: fallback,
        nextStep: "Nakonfigurujte ModelRouter pro AI prioritizaci připomínek.",
      });
      return `[AI není nakonfigurováno]\n\n${fallback}`;
    }

    this.setExplanation({
      currentActivity: "Analyzuji a prioritizuji připomínky pomocí AI.",
      nextStep: "Komunikuji s jazykovým modelem.",
    });

    try {
      const provider = this.deps.aiRouter.getProvider("analyze");
      const pending = this.state.reminders.filter((r) => r.status === "pending");
      const notified = this.state.reminders.filter((r) => r.status === "notified");

      const reminderList = this.state.reminders
        .map(
          (r) =>
            `- [${r.status}] ${r.time} – ${r.description} (${r.source}, priorita: ${r.priority ?? "normal"})`,
        )
        .join("\n");

      const content = [
        `Datum: ${this.state.todayDate}`,
        `Celkem připomínek: ${this.state.reminders.length}`,
        `Čekajících: ${pending.length}`,
        `Odeslaných: ${notified.length}`,
        ``,
        `Seznam připomínek:`,
        reminderList || "Žádné připomínky",
      ].join("\n");

      const messages: AiMessage[] = [
        {
          role: "system",
          content:
            "Jsi asistent pro správu připomínek. Analyzuj dnešní připomínky: prioritizuj je podle důležitosti a urgency, navrhni optimální časy pro notifikace, identifikuj konflikty a navrhni pořadí. Odpovídej česky, stručně a strukturovaně.",
        },
        { role: "user", content },
      ];

      const result = await provider.complete(messages, { temperature: 0.3 });

      this.setExplanation({
        currentActivity: "AI analýza připomínek dokončena.",
        findings: `Analyzováno ${this.state.reminders.length} připomínek. ${pending.length} čeká na odeslání.`,
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
    const pendingCount = this.state.reminders.filter((r) => r.status === "pending").length;
    const notifiedCount = this.state.reminders.filter((r) => r.status === "notified").length;
    const dismissedCount = this.state.reminders.filter((r) => r.status === "dismissed").length;

    return [
      `Přehled připomínek (bez AI):`,
      `- Celkem: ${this.state.reminders.length}`,
      `- Čeká: ${pendingCount}`,
      `- Odesláno: ${notifiedCount}`,
      `- Zahozeno: ${dismissedCount}`,
      ``,
      `Připomínky:`,
      ...this.state.reminders.map(
        (r) => `  [${r.status}] ${r.time} – ${r.description} (${r.priority ?? "normal"})`,
      ),
    ].join("\n");
  }

  private setIdleExplanation(): void {
    this.state.taskProgress = 0;
    const pendingCount = this.state.reminders.filter((r) => r.status === "pending").length;
    const notifiedCount = this.state.reminders.filter((r) => r.status === "notified").length;
    const dismissedCount = this.state.reminders.filter((r) => r.status === "dismissed").length;

    this.setExplanation({
      currentActivity: "Čekám na další kontrolu připomínek.",
      goal: "Být připraven okamžitě reagovat na termíny a notifikace.",
      reason: "Notifier Agent musí hlídat všechny připomínky a upozorňovat včas.",
      findings: `Dnes celkem ${this.state.reminders.length} připomínek – ${pendingCount} čeká, ${notifiedCount} odesláno, ${dismissedCount} zahozeno.`,
      evidence: ["Dnešní připomínky", "Notifikační log"],
      toolsUsed: ["Notifier Service"],
      nextStep: "Zkontrolovat připomínky nebo reagovat na nový požadavek.",
      estimatedCompletion: "Neurčito",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Kontrola připomínek",
      confidence: "100 %",
      alternativeApproach: "Pokud není nový požadavek, provedu pravidelnou kontrolu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
