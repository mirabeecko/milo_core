import type { AgentDefinition, AgentStatus, AgentTask, LiveWorkExplanation } from "@milo/shared";
import { AgentEntityImpl } from "../agent.js";
import { AgentStateMachine } from "../runtime/agent-state-machine.js";
import type { AgentEntityDeps } from "../agent.js";
import { DefaultNotifierService } from "../services/notifier/index.js";
import type { NotifierAgentState, NotifierCheckResult, ReminderItem } from "../services/notifier/types.js";

export interface NotifierSimulationStep {
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

export class NotifierAgent extends AgentEntityImpl {
  private simulationInterval?: ReturnType<typeof setInterval>;
  private runningTick?: Promise<void>;
  private currentStepIndex = 0;
  private notifierService = new DefaultNotifierService();
  private state: NotifierAgentState & { activeTask?: AgentTask; taskHistory: AgentTask[]; pendingQueue: AgentTask[] } = {
    reminders: [],
    todayDate: new Date().toISOString().split("T")[0]!,
    taskProgress: 0,
    taskHistory: [],
    pendingQueue: [],
  };

  private readonly tasks: Omit<AgentTask, "id" | "createdAt">[] = [
    {
      title: "Synchronizovat připomínky",
      description: "Načíst aktuální události, úkoly a emaily a vytvořit připomínky na dnešek.",
      priority: "high",
      status: "pending",
      ownerId: "notifier",
      ownerType: "agent",
      source: "schedule",
      log: [],
      toolsUsed: ["Notifier Service", "Calendar Service", "Task Service"],
      citations: [],
      retryCount: 0,
      estimateMs: 15000,
    },
    {
      title: "Zkontrolovat připomínky",
      description: "Projít dnešní připomínky a zjistit, které je třeba odeslat.",
      priority: "high",
      status: "pending",
      ownerId: "notifier",
      ownerType: "agent",
      source: "schedule",
      log: [],
      toolsUsed: ["Notifier Service"],
      citations: [],
      retryCount: 0,
      estimateMs: 10000,
    },
    {
      title: "Odeslat notifikace",
      description: "Odeslat notifikace pro připomínky, které nastaly.",
      priority: "normal",
      status: "pending",
      ownerId: "notifier",
      ownerType: "agent",
      source: "system",
      log: [],
      toolsUsed: ["Notifier Service", "Notification Service"],
      citations: [],
      retryCount: 0,
      estimateMs: 15000,
    },
  ];

  private readonly steps: NotifierSimulationStep[] = [
    {
      status: "loading_calendar",
      progress: 20,
      activity: "Synchronizuji připomínky z kalendáře, úkolů a emailů.",
      goal: "Mít aktuální seznam všech připomínek na dnešek.",
      reason: "Bez aktuálních dat nemohu správně notifikovat uživatele.",
      findings: "Začínám synchronizaci. Zatím nemám žádné připomínky.",
      evidence: ["Calendar Service", "Task Service", "Email Service"],
      toolsUsed: ["Notifier Service"],
      nextStep: "Vytvořit položky pro dnešní události, úkoly a emaily.",
      estimatedCompletion: "Za 3 sekundy",
      risks: "Pokud nejsou data z kalendáře, použiji pouze úkoly a emaily.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "99 %",
      alternativeApproach: "Pokud selže synchronizace, načtu poslední uložená data.",
      decision: "Synchronizuji přes Notifier Service s daty z ostatních agentů.",
      logs: ["Začínám synchronizaci připomínek.", "Načítám data z kalendáře, úkolů a emailů."],
    },
    {
      status: "analyzing",
      progress: 40,
      activity: "Kontroluji, které připomínky je třeba odeslat.",
      goal: "Zjistit, zda nastal čas pro odeslání notifikace.",
      reason: "Notifikace musí přijít ve správný čas, aby uživatel nebyl obtěžován.",
      findings: "Nalezeno {totalCount} připomínek, z toho {triggeredCount} ke spuštění.",
      evidence: ["Dnešní připomínky", "Aktuální čas"],
      toolsUsed: ["Notifier Service", "Check Engine"],
      nextStep: "Odeslat notifikace pro spuštěné připomínky.",
      estimatedCompletion: "Za 5 sekund",
      risks: "Některé připomínky mohou být už neaktuální.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Synchronizace připomínek",
      confidence: "97 %",
      alternativeApproach: "Pokud je připomínek příliš mnoho, priorizuji ty s bližším termínem.",
      decision: "Kontroluji všechny aktivní připomínky proti aktuálnímu času.",
      logs: ["Kontroluji připomínky proti aktuálnímu času.", "Vyhodnocuji prioritu."],
    },
    {
      status: "working",
      progress: 70,
      activity: "Odesílám notifikace pro spuštěné připomínky.",
      goal: "Upozornit uživatele na blížící se události a deadliny.",
      reason: "Včasná notifikace zvyšuje šanci, že uživatel stihne termín.",
      findings: "Odesláno {notifiedCount} notifikací.",
      evidence: ["Spuštěné připomínky", "Notification Service"],
      toolsUsed: ["Notifier Service", "Notification Service"],
      nextStep: "Označit odeslané připomínky jako notified.",
      estimatedCompletion: "Za 3 sekundy",
      risks: "Pokud notifikační služba není dostupná, připomínky zůstanou pending.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Kontrola připomínek",
      confidence: "98 %",
      alternativeApproach: "Pokud nelze odeslat notifikaci, označím ji pro retry.",
      decision: "Odesílám notifikace a aktualizuji stav připomínek.",
      logs: ["Odesílám notifikace.", "Aktualizuji stav připomínek."],
    },
    {
      status: "reporting",
      progress: 100,
      activity: "Dokončuji a předávám výsledek.",
      goal: "Uložit výsledek a přejít do stavu čekání.",
      reason: "Po odeslání notifikací je potřeba uložit stav a čekat na další cyklus.",
      findings: "Kontrola a odeslání notifikací dokončeny.",
      evidence: ["Výsledek kontroly", "Odeslané notifikace"],
      toolsUsed: ["Notifier Service", "Agent Manager"],
      nextStep: "Přejít do stavu čekání na další kontrolu.",
      estimatedCompletion: "Dokončeno",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Odeslání notifikací",
      confidence: "100 %",
      alternativeApproach: "Pokud uživatel požaduje úpravy, upravím nastavení připomínek.",
      decision: "Výsledek je hotový. Ukládám ho do historie.",
      logs: ["Kontrola připomínek dokončena.", "Výsledek uložen do historie."],
    },
  ];

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
    try {
      await this.notifierService.load();
    } catch (err) {
      console.warn({ err }, "Initial notifier load failed");
    }
    this.state.todayDate = new Date().toISOString().split("T")[0]!;
    this.state.reminders = this.notifierService.getAllReminders();
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
    return [...this.state.taskHistory, ...this.taskHistory];
  }

  getPendingQueue(): AgentTask[] {
    return [...this.state.pendingQueue, ...this.pendingQueue];
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

  private startSimulation(): void {
    if (this.simulationInterval) return;
    if (this.stopped) return;

    this.simulationInterval = setInterval(() => {
      this.runningTick = this.simulateTick()
        .catch((err) => {
          console.error({ err }, "Notifier simulation tick failed");
        })
        .finally(() => { this.runningTick = undefined; });
    }, 60000);

    this.runningTick = this.simulateTick()
      .catch((err) => {
        console.error({ err }, "Notifier simulation tick failed");
      })
      .finally(() => { this.runningTick = undefined; });
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
      await this.runNotifierCheck();
    }

    await this.applyStep(step, activeTask);
    this.currentStepIndex += 1;
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

  private nextTask(): AgentTask | undefined {
    if (this.state.pendingQueue.length > 0) {
      return this.state.pendingQueue.shift();
    }

    const template = this.tasks[this.state.taskHistory.length % this.tasks.length];
    if (!template) return undefined;

    return {
      ...template,
      id: `notifier-task-${this.state.taskHistory.length + 1}`,
      createdAt: new Date().toISOString(),
    };
  }

  private async applyStep(step: NotifierSimulationStep, task: AgentTask): Promise<void> {
    await this.updateAgentStatus(step.status);
    this.state.taskProgress = step.progress;

    const result = this.notifierService.checkReminders(new Date());
    const totalCount = this.state.reminders.length;
    const triggeredCount = result.triggered.length;
    const notifiedCount = result.triggered.filter((r) => r.status === "notified").length;

    const findings = step.findings
      .replace("{totalCount}", String(totalCount))
      .replace("{triggeredCount}", String(triggeredCount))
      .replace("{notifiedCount}", String(notifiedCount));

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
      lastCompletedStep: this.state.taskHistory[0]?.title ?? "Žádný",
      confidence: "100 %",
      alternativeApproach: "Pokud není nový požadavek, provedu pravidelnou kontrolu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
