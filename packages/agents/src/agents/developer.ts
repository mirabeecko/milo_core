import type { AgentDefinition, AgentStatus, AgentTask, LiveWorkExplanation } from "@milo/shared";
import { AgentEntityImpl } from "../agent.js";
import { AgentStateMachine } from "../runtime/agent-state-machine.js";
import type { AgentEntityDeps } from "../agent.js";
import { DefaultDeveloperService } from "../services/developer/index.js";
import type { DeveloperAgentState } from "../services/developer/types.js";

export interface DeveloperSimulationStep {
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

export class DeveloperAgent extends AgentEntityImpl {
  private simulationInterval?: ReturnType<typeof setInterval>;
  private runningTick?: Promise<void>;
  private currentStepIndex = 0;
  private developerService = new DefaultDeveloperService("/Users/mb/dev/MiLO_Core");
  private state: DeveloperAgentState & {
    activeTask?: AgentTask;
    taskHistory: AgentTask[];
    pendingQueue: AgentTask[];
  } = {
    projectPath: "/Users/mb/dev/MiLO_Core",
    issues: [],
    findings: [],
    technicalDebt: 0,
    taskProgress: 0,
    taskHistory: [],
    pendingQueue: [],
  };

  private readonly tasks: Omit<AgentTask, "id" | "createdAt">[] = [
    {
      title: "Analyzovat projekt a architekturu",
      description: "Prozkoumat strukturu kódu, jazyky a detekovat problémy.",
      priority: "high",
      status: "pending",
      ownerId: "developer",
      ownerType: "agent",
      source: "schedule",
      log: [],
      toolsUsed: ["Project Analyzer", "Code Reviewer", "Git Reader"],
      citations: [],
      retryCount: 0,
      estimateMs: 60000,
    },
    {
      title: "Provést code review",
      description: "Zkontrolovat kód na bezpečnost, kvalitu a architekturu.",
      priority: "high",
      status: "pending",
      ownerId: "developer",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Code Reviewer", "Architecture Scorer"],
      citations: [],
      retryCount: 0,
      estimateMs: 45000,
    },
    {
      title: "Spustit build a testy",
      description: "Ověřit, že projekt prochází lintem, buildem a testy.",
      priority: "critical",
      status: "pending",
      ownerId: "developer",
      ownerType: "agent",
      source: "system",
      log: [],
      toolsUsed: ["Build Runner", "Test Runner", "Linter"],
      citations: [],
      retryCount: 0,
      estimateMs: 120000,
    },
    {
      title: "Vyhodnotit technický dluh",
      description: "Sečíst nálezy a vypočítat skóre technického dluhu.",
      priority: "normal",
      status: "pending",
      ownerId: "developer",
      ownerType: "agent",
      source: "dashboard",
      log: [],
      toolsUsed: ["Technical Debt Calculator", "Reporting Service"],
      citations: [],
      retryCount: 0,
      estimateMs: 30000,
    },
  ];

  private readonly steps: DeveloperSimulationStep[] = [
    {
      status: "reading_code",
      progress: 15,
      activity: "Čtu strukturu projektu a identifikuji klíčové moduly.",
      goal: "Získat přehled o velikosti, jazycích a závislostech projektu.",
      reason: "Před jakýmkoliv zásahem musím rozumět aktuální architektuře.",
      findings: "Začínám analýzu. Zatím nemám žádné konkrétní výsledky.",
      evidence: ["Souborový systém", "package.json", "Git historie"],
      toolsUsed: ["Project Analyzer", "Git Reader"],
      nextStep: "Spustit hlubokou analýzu souborů a detekovat duplicity.",
      estimatedCompletion: "Za 10 sekund",
      risks: "Velký projekt může analýzu zpomalit.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "98 %",
      alternativeApproach: "Pokud je projekt příliš velký, analyzuji nejprve jen změněné soubory.",
      decision: "Začnu kompletní analýzou celého projektu, protože je to klíčové pro hodnocení dluhu.",
      logs: ["Začínám analýzu projektu.", "Čtu strukturu adresářů."],
    },
    {
      status: "analyzing",
      progress: 35,
      activity: "Analyzuji metriky kódu a hledám architektonické problémy.",
      goal: "Najít duplicity, příliš velké soubory a porušení Clean Architecture.",
      reason: "Technický dluh se nejčastěji projevuje jako duplicitní kód a špatná modularizace.",
      findings: "Analýza běží. Nalezeno {issueCount} problémů a {findingCount} nálezů.",
      evidence: ["Zdrojové soubory", "Statistiky projektu", "Architektura"],
      toolsUsed: ["Project Analyzer", "Code Reviewer"],
      nextStep: "Vyhodnotit závažnost jednotlivých nálezů.",
      estimatedCompletion: "Za 15 sekund",
      risks: "Některé nálezy mohou být falešně pozitivní.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Načtení struktury projektu",
      confidence: "94 %",
      alternativeApproach: "Pokud je příliš mnoho nálezů, zaměřím se pouze na kritické a vysoké.",
      decision: "Všechny nálezy budou zařazeny do technického dluhu, priorita se určí podle severity.",
      logs: ["Počítám řádky kódu.", "Detekuji duplicitní komponenty.", "Kontroluji architekturu."],
    },
    {
      status: "implementing",
      progress: 55,
      activity: "Připravuji návrhy refaktoringu a sleduji změny v gitu.",
      goal: "Vytvořit akcionabilní plán pro snížení technického dluhu.",
      reason: "Návrhy musí být konkrétní, aby je bylo možné zařadit do sprintu.",
      findings: "Aktivní větev: {branch}. Poslední commit: {lastCommit}. Celkem commitů: {commitCount}.",
      evidence: ["Git log", "Branching", "Poslední merge"],
      toolsUsed: ["Git Reader", "Architecture Scorer"],
      nextStep: "Spustit build a testy pro ověření stability.",
      estimatedCompletion: "Za 12 sekund",
      risks: "Refactoring může ovlivnit závislé moduly.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Analýza metrik a nálezů",
      confidence: "92 %",
      alternativeApproach: "Pokud je aktivních úprav příliš mnoho, počkám na klidnější okamžik.",
      decision: "Doporučím postupné opravy podle priority a dopadu na ostatní moduly.",
      logs: ["Čtu aktuální branch.", "Kontroluji poslední commity.", "Připravuji návrhy refaktoringu."],
    },
    {
      status: "building",
      progress: 75,
      activity: "Spouštím lint a build pro ověření stability kódu.",
      goal: "Ujistit se, že projekt je v konzistentním a builditelném stavu.",
      reason: "Každý návrh změny musí vycházet z aktuálního stavu buildu.",
      findings: "Build: {buildStatus}. Lint: {lintStatus}. Testy: {testStatus}.",
      evidence: ["Build output", "Lint output", "Test output"],
      toolsUsed: ["Build Runner", "Linter", "Test Runner"],
      nextStep: "Vyhodnotit výsledky a aktualizovat skóre technického dluhu.",
      estimatedCompletion: "Za 20 sekund",
      risks: "Build může trvat déle u velkých monorep.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Návrh refaktoringu",
      confidence: "96 %",
      alternativeApproach: "Pokud build selže, analyzuji chyby a navrhnu opravu jako první prioritu.",
      decision: "Spouštím lint a build v kořenu projektu přes pnpm -r.",
      logs: ["Spouštím lint.", "Spouštím build.", "Kontroluji výstup."],
    },
    {
      status: "reviewing",
      progress: 90,
      activity: "Vyhodnocuji výsledky a počítám technický dluh.",
      goal: "Sečíst všechny nálezy a převést je na měřitelné skóre.",
      reason: "Uživatel potřebuje jednoduchou metriku, podle které může rozhodovat.",
      findings: "Technický dluh: {technicalDebt}. Architektura: {architectureScore}/100. Problémů: {issueCount}.",
      evidence: ["Všechny nálezy", "Architektura skóre", "Build výsledky"],
      toolsUsed: ["Technical Debt Calculator", "Architecture Scorer"],
      nextStep: "Vytvořit report a předat výsledky Chief of Staff.",
      estimatedCompletion: "Za 8 sekund",
      risks: "Skóre je orientační – některé nálezy vyžadují lidské posouzení.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Build a testy",
      confidence: "95 %",
      alternativeApproach: "Pokud je dluh vysoký, navrhnu okamžitý architektonický audit.",
      decision: "Technický dluh se počítá ze severity nálezů a architektonického skóre.",
      logs: ["Počítám technický dluh.", "Vyhodnocuji architekturu.", "Připravuji report."],
    },
    {
      status: "reporting",
      progress: 100,
      activity: "Dokončuji report a ukládám výsledky.",
      goal: "Předat uživateli a Chief of Staff přehled o stavu projektu.",
      reason: "Každý agent musí svou práci zdokumentovat a sdílet s týmem.",
      findings: "Analýza dokončena. Projekt má {totalFiles} souborů, {totalLines} řádků, technický dluh {technicalDebt}.",
      evidence: ["Report", "Metriky", "Git info"],
      toolsUsed: ["Reporting Service", "Agent Manager"],
      nextStep: "Přejít do stavu čekání na další úkol.",
      estimatedCompletion: "Dokončeno",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Výpočet technického dluhu",
      confidence: "99 %",
      alternativeApproach: "Pokud uživatel potřebuje detail, otevře detail agenta.",
      decision: "Výsledek je hotový. Ukládám ho do paměti a historie úkolů.",
      logs: ["Report dokončen.", "Výsledek uložen do historie."],
    },
  ];

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.syncDeveloperState();
  }

  async start(): Promise<void> {
    await super.start();
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

  getDeveloperState(): DeveloperAgentState {
    return this.state;
  }

  async syncDeveloperState(): Promise<void> {
    await this.developerService.sync(this.state.projectPath);
    const synced = this.developerService.getState();
    this.state = { ...this.state, ...synced };
  }

  async runBuild(): Promise<void> {
    await this.developerService.runBuild(this.state.projectPath);
    this.state.build = this.developerService.getState().build;
  }

  async runTests(): Promise<void> {
    await this.developerService.runTests(this.state.projectPath);
    this.state.tests = this.developerService.getState().tests;
  }

  async runLint(): Promise<void> {
    await this.developerService.runLint(this.state.projectPath);
    this.state.lint = this.developerService.getState().lint;
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
      await this.syncDeveloperState();
    } else if (this.currentStepIndex === 3) {
      await this.runLint();
      await this.runBuild();
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
      id: `dev-task-${this.state.taskHistory.length + 1}`,
      createdAt: new Date().toISOString(),
    };
  }

  private async applyStep(step: DeveloperSimulationStep, task: AgentTask): Promise<void> {
    await this.updateAgentStatus(step.status);
    this.state.taskProgress = step.progress;

    const findings = this.interpolateFindings(step.findings);
    const nextStep = this.interpolateFindings(step.nextStep);

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

  private interpolateFindings(template: string): string {
    const stats = this.state.stats;
    const git = this.state.git;
    const build = this.state.build;
    const lint = this.state.lint;
    const tests = this.state.tests;
    const issues = this.state.issues;
    const findings = this.state.findings;
    const score = this.state.architectureScore;

    return template
      .replace("{issueCount}", String(issues.length))
      .replace("{findingCount}", String(findings.length))
      .replace("{branch}", git?.branch ?? "unknown")
      .replace("{lastCommit}", git?.lastCommit?.message ?? "unknown")
      .replace("{commitCount}", String(git?.commitCount ?? 0))
      .replace("{buildStatus}", build?.status === "success" ? "úspěšný" : build?.status === "failure" ? "selhal" : "neznámý")
      .replace("{lintStatus}", lint?.status === "success" ? "úspěšný" : lint?.status === "failure" ? "selhal" : "neznámý")
      .replace("{testStatus}", tests?.status === "success" ? "úspěšné" : tests?.status === "failure" ? "selhaly" : "neznámé")
      .replace("{technicalDebt}", String(this.state.technicalDebt))
      .replace("{architectureScore}", String(score?.overall ?? 0))
      .replace("{totalFiles}", String(stats?.totalFiles ?? 0))
      .replace("{totalLines}", String(stats?.totalLines ?? 0));
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
      currentActivity: "Čekám na další vývojový úkol nebo instrukci.",
      goal: "Být připraven analyzovat kód, provést review nebo spustit build.",
      reason: "Developer Agent hlídá kvalitu projektu a musí být vždy připraven.",
      findings: `Projekt má ${this.state.stats?.totalFiles ?? 0} souborů, ${this.state.stats?.totalLines ?? 0} řádků, technický dluh ${this.state.technicalDebt}. Poslední sync: ${this.state.lastSyncedAt ? new Date(this.state.lastSyncedAt).toLocaleTimeString() : "nikdy"}.`,
      evidence: ["Souborový systém", "Git", "Build output"],
      toolsUsed: ["Project Analyzer", "Code Reviewer", "Build Runner"],
      nextStep: "Přijmout další úkol nebo provést pravidelnou kontrolu.",
      estimatedCompletion: "Neurčito",
      risks: "Žádná.",
      needsFromUser: "Nic.",
      lastCompletedStep: this.state.taskHistory[0]?.title ?? "Žádný",
      confidence: "100 %",
      alternativeApproach: "Pokud není úkol, provedu pravidelnou kontrolu kvality podle plánu.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
