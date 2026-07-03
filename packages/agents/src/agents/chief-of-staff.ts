import type { AgentDefinition, AgentStatus, AgentTask, LiveWorkExplanation } from "@milo/shared";
import { AgentEntityImpl } from "../agent.js";
import { AgentStateMachine } from "../runtime/agent-state-machine.js";
import type { AgentEntityDeps } from "../agent.js";

export interface SimulationStep {
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

export interface ChiefOfStaffState {
  activeTask?: AgentTask;
  taskProgress: number;
  taskHistory: AgentTask[];
  pendingQueue: AgentTask[];
  runningTimeMs: number;
  lastActivityAt?: string;
}

export class ChiefOfStaffAgent extends AgentEntityImpl {
  private simulationInterval?: ReturnType<typeof setInterval>;
  private runningTick?: Promise<void>;
  private currentStepIndex = 0;
  private state: ChiefOfStaffState = {
    taskProgress: 0,
    taskHistory: [],
    pendingQueue: [],
    runningTimeMs: 0,
  };

  private readonly tasks: Omit<AgentTask, "id" | "createdAt">[] = [
    {
      title: "Připravit ranní briefing",
      description: "Shrnutí dne, priority a schůzky.",
      priority: "critical",
      status: "pending",
      ownerId: "chief-of-staff",
      ownerType: "agent",
      source: "schedule",
      log: [],
      toolsUsed: ["Email Service", "Calendar Service", "Task Manager", "Knowledge Service"],
      citations: [],
      retryCount: 0,
      estimateMs: 45000,
    },
    {
      title: "Zkontrolovat priority dne",
      description: "Vyhodnotit důležitost a naléhavost úkolů.",
      priority: "high",
      status: "pending",
      ownerId: "chief-of-staff",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Task Manager", "Knowledge Service"],
      citations: [],
      retryCount: 0,
      estimateMs: 30000,
    },
    {
      title: "Delegovat analýzu dokumentů",
      description: "Požádat Legal Agenta o kontrolu smluv.",
      priority: "high",
      status: "pending",
      ownerId: "chief-of-staff",
      ownerType: "agent",
      source: "user",
      log: [],
      toolsUsed: ["Task Manager", "Agent Manager"],
      citations: [],
      retryCount: 0,
      estimateMs: 25000,
    },
    {
      title: "Sestavit report pro uživatele",
      description: "Stručný přehled toho, co udělali agenti.",
      priority: "normal",
      status: "pending",
      ownerId: "chief-of-staff",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Agent Manager", "Reporting Service"],
      citations: [],
      retryCount: 0,
      estimateMs: 35000,
    },
  ];

  private readonly steps: SimulationStep[] = [
    {
      status: "thinking",
      progress: 10,
      activity: "Přijímám úkol a analyzuji kontext.",
      goal: "Rozumět zadání a rozhodnout, jak s ním naložit.",
      reason: "Každý úkol musím nejprve pochopit, než ho rozložím na kroky.",
      findings: "Zatím začínám. Nemám žádné konkrétní výsledky.",
      evidence: ["Interní fronta úkolů", "Historie předchozích briefingu"],
      toolsUsed: ["Task Manager"],
      nextStep: "Rozdělit úkol na dílčí kroky a určit prioritu.",
      estimatedCompletion: "Za několik sekund",
      risks: "Žádné známé riziko.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "98 %",
      alternativeApproach: "Pokud není jasné zadání, požádám uživatele o upřesnění.",
      decision: "Úkol je v mé kompetenci. Nepotřebuji ho delegovat jinému agentovi.",
      logs: ["Přijal jsem nový úkol.", "Začínám analýzu kontextu."],
    },
    {
      status: "planning",
      progress: 25,
      activity: "Plánuji postup a vybírám nástroje.",
      goal: "Vytvořit plán, který povede k požadovanému výstupu.",
      reason: "Dobrý plán šetří čas a zvyšuje kvalitu výsledku.",
      findings: "Identifikoval jsem klíčové zdroje, které budu potřebovat.",
      evidence: ["Task Manager", "Knowledge Service"],
      toolsUsed: ["Task Manager", "Knowledge Service", "Calendar Service"],
      nextStep: "Načíst aktuální data z emailů, kalendáře a úkolů.",
      estimatedCompletion: "Za 30 sekund",
      risks: "Některý zdroj může být dočasně nedostupný.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Analýza úkolu",
      confidence: "96 %",
      alternativeApproach: "Pokud nějaký zdroj chybí, použiji jen dostupné informace.",
      decision: "Pro briefing potřebuji emaily, kalendář a úkoly. Použiji mock data, dokud nejsou napojeny reálné služby.",
      logs: ["Rozdělil jsem úkol na kroky.", "Vybral jsem potřebné nástroje."],
    },
    {
      status: "delegating",
      progress: 40,
      activity: "Načítám data z připojených zdrojů.",
      goal: "Získat aktuální informace pro další zpracování.",
      reason: "Briefing musí vycházet z reálných dat.",
      findings: "Našel jsem:\n• 2 důležité emaily\n• 1 schůzku\n• 3 otevřené úkoly",
      evidence: ["Mock Email", "Mock Calendar", "Mock Tasks"],
      toolsUsed: ["Email Service", "Calendar Service", "Task Manager"],
      nextStep: "Vyhodnotit důležitost jednotlivých položek.",
      estimatedCompletion: "Za 20 sekund",
      risks: "Mock data nemusí plně odrážet reálný stav.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Plán vytvořen",
      confidence: "94 %",
      alternativeApproach: "Pokud není dostupný zdroj, pokračuji s tím, co mám.",
      decision: "Data z mock zdrojů jsou dostatečná pro sestavení briefing struktury.",
      logs: ["Načítám mock emaily.", "Načítám mock kalendář.", "Načítám mock úkoly."],
    },
    {
      status: "working",
      progress: 60,
      activity: "Vyhodnocuji důležitost a prioritu každé položky.",
      goal: "Určit, co je dnes skutečně důležité.",
      reason: "Uživatel nemá čas procházet všechny informace ručně.",
      findings: "Identifikoval jsem 1 kritickou prioritu a 2 důležité úkoly.",
      evidence: ["Mock Email", "Mock Tasks"],
      toolsUsed: ["Knowledge Service", "Task Manager"],
      nextStep: "Sestavit strukturovaný briefing.",
      estimatedCompletion: "Za 15 sekund",
      risks: "Termín u kritické priority je dnes do 12:00.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Data načtena",
      confidence: "92 %",
      alternativeApproach: "Pokud není jasná priorita, zeptám se uživatele na jeho preference.",
      decision: "Smlouva pro TJ Krupka je kritická kvůli dnešnímu deadline.",
      logs: ["Vyhodnocuji důležitost emailů.", "Kontroluji deadline u úkolů."],
    },
    {
      status: "reviewing",
      progress: 80,
      activity: "Kontroluji kvalitu a úplnost briefing.",
      goal: "Mít jistotu, že briefing je stručný a akcionabilní.",
      reason: "Nechci uživatele zatěžovat zbytečnými detaily.",
      findings: "Briefing obsahuje všechny klíčové sekce: shrnutí, priority, schůzky, rozhodnutí.",
      evidence: ["Mock Documents", "Mock Tasks"],
      toolsUsed: ["Knowledge Service", "Reporting Service"],
      nextStep: "Předat briefing uživateli a uložit výsledek.",
      estimatedCompletion: "Za 5 sekund",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Vyhodnocení priorit",
      confidence: "96 %",
      alternativeApproach: "Pokud briefing působí neúplně, doplním sekci s riziky.",
      decision: "Briefing je připraven k prezentaci. Přidávám doporučený první krok.",
      logs: ["Kontroluji strukturu briefing.", "Přidávám doporučené kroky."],
    },
    {
      status: "reporting",
      progress: 100,
      activity: "Dokončuji a předávám výsledek.",
      goal: "Uložit výsledek a informovat uživatele.",
      reason: "Uživatel musí mít okamžitý přístup k briefing.",
      findings: "Briefing byl úspěšně vytvořen a je připraven k zobrazení.",
      evidence: ["Výsledek briefing", "Použité zdroje"],
      toolsUsed: ["Reporting Service", "Agent Manager"],
      nextStep: "Přejít do stavu čekání na další úkol.",
      estimatedCompletion: "Dokončeno",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Kontrola kvality",
      confidence: "99 %",
      alternativeApproach: "Pokud uživatel požaduje změny, upravím briefing na základě zpětné vazby.",
      decision: "Výsledek je hotový. Ukládám ho do paměti a historie úkolů.",
      logs: ["Briefing dokončen.", "Výsledek uložen do historie."],
    },
  ];

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async start(): Promise<void> {
    await super.start();
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
      id: `cos-task-${this.state.taskHistory.length + 1}`,
      createdAt: new Date().toISOString(),
    };
  }

  private async applyStep(step: SimulationStep, task: AgentTask): Promise<void> {
    await this.updateAgentStatus(step.status);
    this.state.taskProgress = step.progress;

    const explanation: Partial<LiveWorkExplanation> = {
      currentActivity: step.activity,
      goal: step.goal,
      reason: step.reason,
      findings: step.findings,
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
      currentActivity: "Čekám na další úkol nebo instrukci.",
      goal: "Být připraven okamžitě reagovat na nové zadání.",
      reason: "Chief of Staff je koordinátor, který musí být vždy připraven.",
      findings: `Dokončeno ${this.completedTasks} úkolů. ${this.state.pendingQueue.length} úkolů čeká ve frontě.`,
      evidence: ["Historie úkolů", "Interní fronta"],
      toolsUsed: ["Agent Manager", "Task Manager"],
      nextStep: "Přijmout další úkol nebo provést pravidelnou kontrolu.",
      estimatedCompletion: "Neurčito",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: this.state.taskHistory[0]?.title ?? "Žádný",
      confidence: "100 %",
      alternativeApproach: "Pokud není úkol, mohu proaktivně připravit ranní briefing podle plánu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
