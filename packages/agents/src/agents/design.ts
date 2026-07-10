import type { AgentDefinition, AgentStatus, AgentTask, LiveWorkExplanation } from "@milo/shared";
import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";

interface SimulationStep {
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

const simulationSteps: SimulationStep[] = [
  {
    status: "analyzing",
    progress: 10,
    activity: "Analyzuji vizuální konzistenci napříč projekty",
    goal: "Ověřit jednotný vizuální styl",
    reason: "Konzistentní design zlepšuje uživatelský dojem",
    findings: "Procházím CSS soubory a komponenty...",
    evidence: ["Tailwind config", "globální CSS proměnné"],
    toolsUsed: ["filesystem:read"],
    nextStep: "Identifikace odchylek od design systému",
    estimatedCompletion: "2 min",
    risks: "Různé projekty mohou mít různé design systémy",
    needsFromUser: "Seznam prioritních projektů pro vizuální review",
    lastCompletedStep: "Spuštění agenta",
    confidence: "vysoká",
    alternativeApproach: "Manuální review",
    decision: "Začít s hlavním dashboardem",
    logs: ["Zahájeno skenování vizuální konzistence."],
  },
  {
    status: "working",
    progress: 40,
    activity: "Identifikuji responzivní problémy",
    goal: "Najít breakpointy kde se layout rozbíjí",
    reason: "Mobilní návštěvnost je přes 50%",
    findings: "Některé komponenty nemají definované mobile styly",
    evidence: ["Chybí sm: prefixy u grid layoutů", "Tabulky bez horizontálního scrollu"],
    toolsUsed: ["filesystem:read"],
    nextStep: "Návrh oprav pro nalezené problémy",
    estimatedCompletion: "5 min",
    risks: "Změny mohou ovlivnit desktop layout",
    needsFromUser: "",
    lastCompletedStep: "Analýza vizuální konzistence",
    confidence: "střední",
    alternativeApproach: "Použít automatický linter",
    decision: "Připravit CSS-only opravy",
    logs: ["Nalezeny responzivní nedostatky v 3 komponentách."],
  },
  {
    status: "reviewing",
    progress: 70,
    activity: "Připravuji návrhy vizuálních vylepšení",
    goal: "Navrhnout konkrétní CSS změny",
    reason: "Změny musí být bezpečné a neovlivnit funkcionalitu",
    findings: "3 návrhy připraveny k aplikaci",
    evidence: ["Dashboard: přidat grid-cols-1 pro mobil", "Tabulky: přidat overflow-x-auto"],
    toolsUsed: ["filesystem:read"],
    nextStep: "Čekání na schválení změn uživatelem",
    estimatedCompletion: "1 min",
    risks: "",
    needsFromUser: "Schválit nebo zamítnout navržené změny",
    lastCompletedStep: "Identifikace responzivních problémů",
    confidence: "vysoká",
    alternativeApproach: "Automaticky aplikovat safe změny",
    decision: "Počkat na schválení",
    logs: ["Připraveny návrhy na vizuální vylepšení."],
  },
];

export class DesignAgent extends AgentEntityImpl {
  private simulationInterval?: ReturnType<typeof setInterval>;
  private runningTick?: Promise<void>;
  private currentStepIndex = 0;
  private cycleCount = 0;

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
    return this.cycleCount * 33 + this.currentStepIndex * 11;
  }

  private startSimulation(): void {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => {
      this.runningTick = this.tick().catch(console.error);
    }, 6000 + Math.random() * 4000);
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
  }

  private async tick(): Promise<void> {
    const step = simulationSteps[this.currentStepIndex % simulationSteps.length];
    this.currentStepIndex++;
    if (this.currentStepIndex >= simulationSteps.length) {
      this.currentStepIndex = 0;
      this.cycleCount++;
    }

    const explanation: LiveWorkExplanation = {
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
      decisionLog: [{ timestamp: new Date().toISOString(), thought: step.decision }],
      updatedAt: new Date().toISOString(),
    };

    this.transitionTo(step.status);
    this.setExplanation(explanation);
    await this.log("info", step.logs[0] ?? "Tick completed");
  }

  override explain(): LiveWorkExplanation {
    return {
      currentActivity: "Analyzuji vizuální konzistenci a responzivitu UI komponent",
      goal: "Konzistentní a responzivní design napříč projekty",
      reason: "Konzistentní design je klíčový pro dobrou uživatelskou zkušenost",
      findings: `Fáze ${this.currentStepIndex + 1} ze 3, cyklus ${this.cycleCount}`,
      evidence: ["CSS review", "Responsive check"],
      toolsUsed: ["filesystem:read"],
      nextStep: "Připravit konkrétní CSS-only návrhy na zlepšení",
      estimatedCompletion: "2-5 minut",
      risks: "Změny mohou ovlivnit desktop layout",
      needsFromUser: "Schválení navržených vizuálních změn před aplikací",
      lastCompletedStep: this.cycleCount > 0 ? "Dokončen jeden cyklus analýzy" : "Analýza v procesu",
      confidence: "vysoká",
      alternativeApproach: "Manuální review",
      decisionLog: [],
      updatedAt: new Date().toISOString(),
    };
  }
}
