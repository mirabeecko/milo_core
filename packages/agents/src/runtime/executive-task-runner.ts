/**
 * Executive Task Runner — propojuje agentí úkoly s reálnými MiLO komponentami.
 *
 * Používá dependency injection — capability handlery se předají přes constructor.
 * API vrstva (apps/api) pak zaregistruje reálné implementace.
 */
import type { Agent, AgentTask, LiveWorkExplanation, TaskLogEntry, TaskResult, ToolCall } from "@milo/shared";
import type { ToolContext, ToolRegistry } from "@milo/tools";
import type { AgentEventBus, TaskQueue, TaskRunner, TaskRunnerCallbacks } from "../types.js";
import { ExecutionTaskRunner, type ExecutionTaskRunnerDeps } from "./execution-task-runner.js";

/** Signatura capability handleru — dostane task a vrátí result */
export type ExecutiveCapabilityHandler = (
  task: AgentTask,
  agent: Agent,
) => Promise<{ output: string; metadata?: Record<string, unknown> }>;

/** Registr capability podle task typu */
export type ExecutiveCapabilityRegistry = Record<string, ExecutiveCapabilityHandler>;

export class ExecutiveTaskRunner extends ExecutionTaskRunner implements TaskRunner {
  private capabilities: ExecutiveCapabilityRegistry;

  constructor(deps: ExecutionTaskRunnerDeps, capabilities: ExecutiveCapabilityRegistry = {}) {
    super(deps);
    this.capabilities = capabilities;
  }

  /** Zaregistruje novou capability */
  registerCapability(taskType: string, handler: ExecutiveCapabilityHandler): void {
    this.capabilities[taskType] = handler;
  }

  /** Přepisuje runStrategy — přidává executive task typy */
  protected async runStrategy(
    task: AgentTask,
    agent: Agent,
    context: ToolContext,
    helpers: {
      log: TaskLogEntry[];
      toolCalls: ToolCall[];
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const type = task.type ?? "custom";

    // Zkus najít registrovanou capability
    const handler = this.capabilities[type];
    if (handler) {
      helpers.addLog("info", `Spouštím capability: ${type}`);
      helpers.updateExplanation({
        currentActivity: `Executing: ${type}`,
        nextStep: "Volám capability handler",
      });
      await helpers.reportProgress(10);

      try {
        const result = await handler(task, agent);
        helpers.addLog("info", `Capability ${type} dokončena`);
        helpers.updateExplanation({
          currentActivity: `${type} dokončeno`,
          findings: result.output?.slice(0, 100) ?? "Hotovo",
          nextStep: "Předám výsledek",
          confidence: "vysoká",
        });
        await helpers.reportProgress(100);

        return {
          output: result.output,
          metadata: result.metadata ?? { capability: type },
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        helpers.addLog("error", `Capability ${type} selhala: ${msg}`);
        return {
          output: `❌ ${type}: ${msg}`,
          metadata: { degraded: true, error: msg },
        };
      }
    }

    // Speciální handling pro executive:mission — dekompozice na sub-capability
    if (type === "executive:mission") {
      return this.executeMission(task, agent, context, helpers);
    }

    // Fallback na standardní strategie
    return super.runStrategy(task, agent, context, helpers);
  }

  /** Mise: dekomponuje na pod-úkoly a spustí je */
  private async executeMission(
    task: AgentTask,
    agent: Agent,
    context: ToolContext,
    helpers: {
      log: TaskLogEntry[];
      toolCalls: ToolCall[];
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const missionTitle = task.description ?? task.title;
    helpers.addLog("info", `Zahajuji misi: ${missionTitle}`);
    helpers.updateExplanation({
      currentActivity: `Mise: ${missionTitle}`,
      nextStep: "Dekomponuji misi na pod-úkoly",
    });
    await helpers.reportProgress(5);

    const subTasks = this.decomposeMission(missionTitle, agent);

    const results: string[] = [];
    let stepProgress = 10;

    for (const subTask of subTasks) {
      helpers.addLog("info", `  ↳ ${subTask.title}`);
      helpers.updateExplanation({
        currentActivity: subTask.title,
        nextStep: subTasks.indexOf(subTask) < subTasks.length - 1
          ? subTasks[subTasks.indexOf(subTask) + 1].title
          : "Dokončuji misi",
      });

      const handler = this.capabilities[subTask.type];
      if (handler) {
        try {
          const result = await handler(
            { ...task, type: subTask.type, title: subTask.title, description: subTask.query },
            agent,
          );
          results.push(`### ${subTask.title}\n${result.output}`);
        } catch (error) {
          results.push(`### ${subTask.title}\n❌ Selhalo: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        results.push(`### ${subTask.title}\n⚠️ Capability ${subTask.type} není registrovaná`);
      }

      stepProgress += Math.floor(80 / subTasks.length);
      await helpers.reportProgress(Math.min(stepProgress, 95));
    }

    helpers.addLog("info", `Mise "${missionTitle}" dokončena — ${results.length} kroků`);
    helpers.updateExplanation({
      currentActivity: `Mise "${missionTitle}" dokončena`,
      findings: `${results.length} kroků provedeno`,
      nextStep: "Hotovo",
      confidence: "vysoká",
    });
    await helpers.reportProgress(100);

    return {
      output: `# Mise: ${missionTitle}\n\n${results.join("\n\n")}`,
      metadata: {
        mission: missionTitle,
        subTasks: results.length,
        agent: agent.name,
      },
    };
  }

  /** Rozloží misi na konkrétní exekutivní pod-úkoly */
  private decomposeMission(
    mission: string,
    _agent: Agent,
  ): Array<{ title: string; type: string; query: string }> {
    const lower = mission.toLowerCase();

    if (/briefing|brief|ranní|report/i.test(lower)) {
      return [
        { title: "Generuji Executive Brief", type: "executive:brief", query: "brief" },
        { title: "Kontrola Docker stavu", type: "executive:docker", query: "docker" },
        { title: "Prioritizace projektů", type: "executive:projects", query: "projects" },
      ];
    }

    if (/systém|system|stav|status|health/i.test(lower)) {
      return [
        { title: "Kontrola Docker kontejnerů", type: "executive:docker", query: "docker" },
        { title: "Načítám System Registry", type: "executive:system", query: "system" },
        { title: "Kontrola LLM nákladů", type: "executive:costs", query: "costs" },
      ];
    }

    if (/hledej|vyhledej|najdi|search|find/i.test(lower)) {
      const query = mission.replace(/^(hledej|vyhledej|najdi|search|find)\s+/i, "").trim();
      return [
        { title: `Fulltext vyhledávání: ${query || mission}`, type: "executive:search", query: query || mission },
      ];
    }

    if (/audit|kontrola|review/i.test(lower)) {
      return [
        { title: "Spouštím audit agenta", type: "executive:audit", query: "audit" },
        { title: "Kontrola System Registry", type: "executive:system", query: "system" },
      ];
    }

    if (/docker|kontejner/i.test(lower)) {
      return [
        { title: "Kontrola Docker kontejnerů", type: "executive:docker", query: "docker" },
      ];
    }

    if (/projekt|priorit/i.test(lower)) {
      return [
        { title: "Prioritizace projektů", type: "executive:projects", query: "projects" },
      ];
    }

    // Default
    return [
      { title: "Kontrola systému", type: "executive:system", query: "system" },
      { title: "Prioritizace projektů", type: "executive:projects", query: "projects" },
    ];
  }
}
