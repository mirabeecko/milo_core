import type { Agent, AgentTask, LiveWorkExplanation, TaskLogEntry, TaskResult, ToolCall } from "@milo/shared";
import type { ToolContext, ToolRegistry } from "@milo/tools";
import type { AgentEventBus, TaskQueue, TaskRunner, TaskRunnerCallbacks } from "../types.js";

export interface ExecutionTaskRunnerDeps {
  queue: TaskQueue;
  eventBus: AgentEventBus;
  toolRegistry: ToolRegistry;
  vaultPath?: string;
  projectPath?: string;
}

export class ExecutionTaskRunner implements TaskRunner {
  constructor(private deps: ExecutionTaskRunnerDeps) {}

  async execute(
    task: AgentTask,
    agent: Agent,
    callbacks?: TaskRunnerCallbacks,
  ): Promise<Record<string, unknown>> {
    const job = await this.deps.queue.add({
      taskId: task.id,
      agentId: agent.id,
      type: task.type ?? "custom",
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
      },
    });

    await this.deps.eventBus.publish({
      type: "agent:task:started",
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      payload: { taskId: task.id, jobId: job.id },
    });

    const startedAt = Date.now();
    const log: TaskLogEntry[] = [];
    const toolCalls: ToolCall[] = [];

    const addLog = (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => {
      const entry: TaskLogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata,
      };
      log.push(entry);
      callbacks?.onLog?.(entry);
    };

    const reportProgress = async (progress: number) => {
      await this.deps.queue.updateProgress(job.id, progress);
      callbacks?.onProgress?.(progress);
    };

    const updateExplanation = (partial: Partial<LiveWorkExplanation>) => {
      callbacks?.onExplanation?.(partial);
    };

    const context: ToolContext = {
      userId: "system",
      traceId: `agent-${agent.id}`,
      agentId: agent.id,
      vaultPath: this.deps.vaultPath,
      projectPath: this.deps.projectPath,
    };

    try {
      addLog("info", `Spouštím úkol typu ${task.type}: ${task.title}`);
      updateExplanation({ currentActivity: `Spouštím úkol: ${task.title}`, lastCompletedStep: "Přijetí úkolu" });
      await reportProgress(5);

      const result = await this.runStrategy(task, agent, context, {
        log,
        toolCalls,
        addLog,
        reportProgress,
        updateExplanation,
      });

      const actualTimeMs = Date.now() - startedAt;
      const taskResult: TaskResult = {
        output: result.output,
        citations: result.citations,
        metadata: {
          ...result.metadata,
          actualTimeMs,
          toolCallsCount: toolCalls.length,
        },
      };

      const completedResult: Record<string, unknown> = {
        taskId: task.id,
        status: "completed" as const,
        ...taskResult,
        log,
        toolCalls,
      };

      await this.deps.queue.complete(job.id, completedResult);
      await this.deps.eventBus.publish({
        type: "agent:task:completed",
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        payload: { taskId: task.id, jobId: job.id, result: completedResult },
      });

      return completedResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog("error", `Úkol selhal: ${message}`);
      await this.deps.queue.fail(job.id, message);
      await this.deps.eventBus.publish({
        type: "agent:task:failed",
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        payload: { taskId: task.id, jobId: job.id, error: message },
      });
      throw error;
    }
  }

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
    const text = (task.description ?? task.title ?? "").toLowerCase();
    const isWeatherQuery = /počasí|předpověď|vítr|větru|teplota|teploty|weather|wind|forecast|temperature/.test(text);

    switch (task.type) {
      case "search":
        return isWeatherQuery
          ? this.executeWeather(task, agent, context, helpers)
          : this.executeSearch(task, agent, context, helpers);
      case "analyze":
        return this.executeAnalyze(task, agent, context, helpers);
      case "summarize":
        return this.executeSummarize(task, agent, context, helpers);
      case "report":
        return this.executeReport(task, agent, context, helpers);
      case "delegate":
        return this.executeDelegate(task, agent, context, helpers);
      default:
        return isWeatherQuery
          ? this.executeWeather(task, agent, context, helpers)
          : this.executeCustom(task, agent, context, helpers);
    }
  }

  private async executeSearch(
    task: AgentTask,
    _agent: Agent,
    context: ToolContext,
    { addLog, reportProgress, updateExplanation, toolCalls }: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const query = this.extractQuery(task);
    if (!query) {
      throw new Error("Nelze určit hledaný výraz z úkolu");
    }

    addLog("info", `Hledám: "${query}"`);

    if (!context.vaultPath) {
      addLog("error", "Obsidian vault není nakonfigurován");
      throw new Error("Obsidian vault není nakonfigurován. Nastavte vaultPath pro vyhledávání.");
    }

    addLog("info", "Otevírám Obsidian vault");
    updateExplanation({ currentActivity: "Otevírám Obsidian vault", nextStep: "Projdu seznam poznámek" });
    await reportProgress(15);

    const listResult = await this.executeTool("obsidian:list", { maxResults: 1000 }, context, toolCalls);
    const notes = Array.isArray(listResult) ? listResult : [];
    addLog("info", `Nalezeno ${notes.length} poznámek v vaultu`);
    updateExplanation({
      currentActivity: `Analyzuji ${notes.length} markdown souborů`,
      findings: `Nalezeno ${notes.length} poznámek v vaultu`,
      nextStep: `Vyhledám "${query}"`,
    });
    await reportProgress(30);

    const searchResult = await this.executeTool("obsidian:search", { query }, context, toolCalls);
    const matches = Array.isArray(searchResult) ? searchResult : [];
    addLog("info", `Nalezeno ${matches.length} shod pro "${query}"`);
    updateExplanation({
      currentActivity: `Našel jsem ${matches.length} kandidátů`,
      findings: `Nalezeno ${matches.length} shod pro "${query}"`,
      nextStep: "Přečtu obsah nejrelevantnějších souborů",
    });
    await reportProgress(60);

    const readLimit = 5;
    const readResults: Array<{ title: string; content: string }> = [];
    for (const note of matches.slice(0, readLimit)) {
      if (note && typeof note.filePath === "string") {
        try {
          const content = await this.executeTool("obsidian:read", { filePath: note.filePath }, context, toolCalls);
          readResults.push({
            title: typeof note.title === "string" ? note.title : note.filePath,
            content: typeof content === "string" ? content : JSON.stringify(content),
          });
          addLog("info", `Čtu soubor: ${note.filePath}`);
        } catch {
          addLog("warn", `Nepodařilo se přečíst: ${note.filePath}`);
        }
      }
    }
    updateExplanation({
      currentActivity: `Porovnávám metadata a obsah ${readResults.length} souborů`,
      nextStep: "Sestavím finální výsledek",
    });
    await reportProgress(90);

    const citations = matches
      .slice(0, 10)
      .map((note) => (typeof note.filePath === "string" ? note.filePath : String(note.title)))
      .filter(Boolean);

    const output = this.formatSearchResult(query, matches.length, notes.length, readResults);

    return {
      output,
      citations,
      metadata: {
        query,
        totalNotes: notes.length,
        matchCount: matches.length,
        readCount: readResults.length,
      },
    };
  }

  private async executeWeather(
    task: AgentTask,
    _agent: Agent,
    context: ToolContext,
    { addLog, reportProgress, updateExplanation, toolCalls }: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const location = this.extractLocation(task);
    if (!location) {
      throw new Error("Nelze určit lokalitu pro předpověď počasí");
    }

    addLog("info", `Zjistuji předpověď větru pro: ${location}`);
    updateExplanation({ currentActivity: `Zjistuji předpověď pro ${location}`, nextStep: "Zavolám weather API" });
    await reportProgress(20);

    const forecast = await this.executeTool(
      "weather:forecast",
      { location, days: 3 },
      context,
      toolCalls,
    );

    if (!forecast || typeof forecast !== "object") {
      throw new Error("Weather API nevrátilo data");
    }

    const typed = forecast as { location: string; days: Array<{ date: string; maxWindSpeedKmh: number; maxWindGustsKmh: number; dominantWindDirection: number }> };
    addLog("info", `Předpověď získána pro ${typed.location}`);
    updateExplanation({
      currentActivity: "Zpracovávám předpověď větru",
      findings: `Získáno ${typed.days.length} dnů předpovědi`,
      nextStep: "Vrátím výsledek",
    });
    await reportProgress(90);

    return {
      output: this.formatWeatherResult(typed.location, typed.days),
      citations: ["Open-Meteo"],
      metadata: {
        location: typed.location,
        daysCount: typed.days.length,
      },
    };
  }

  private async executeAnalyze(
    task: AgentTask,
    _agent: Agent,
    _context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    helpers.addLog("info", "Analyzuji zadání");
    helpers.updateExplanation({ currentActivity: "Analyzuji zadání", nextStep: "Vrátím výsledek analýzy" });
    return {
      output: `Analýza úkolu "${task.title}" dokončena. K dispozici je ${task.toolCalls?.length ?? 0} předchozích volání nástrojů.`,
      metadata: { taskType: task.type },
    };
  }

  private async executeSummarize(
    task: AgentTask,
    _agent: Agent,
    _context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    helpers.addLog("info", "Sestavuji shrnutí");
    helpers.updateExplanation({ currentActivity: "Sestavuji shrnutí", nextStep: "Uložím výsledek" });
    await helpers.reportProgress(50);
    const output = task.description
      ? `Shrnutí: ${task.description}`
      : `Shrnutí úkolu "${task.title}".`;
    return { output, metadata: { taskType: task.type } };
  }

  private async executeReport(
    task: AgentTask,
    _agent: Agent,
    _context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    helpers.addLog("info", "Sestavuji finální report");
    helpers.updateExplanation({ currentActivity: "Sestavuji finální report", nextStep: "Předám výsledek" });
    await helpers.reportProgress(50);
    const output = task.description ?? `Report k úkolu "${task.title}".`;
    return { output, metadata: { taskType: task.type } };
  }

  private async executeDelegate(
    task: AgentTask,
    _agent: Agent,
    _context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    helpers.addLog("info", `Deleguji úkol: ${task.title}`);
    helpers.updateExplanation({ currentActivity: `Deleguji úkol ${task.title}`, nextStep: "Předám výsledek delegaci" });
    await helpers.reportProgress(50);
    return {
      output: `Úkol "${task.title}" připraven k delegaci.`,
      metadata: { targetAgent: task.ownerId },
    };
  }

  private async executeCustom(
    task: AgentTask,
    _agent: Agent,
    _context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown>; status: "cancelled" }> {
    helpers.addLog("warn", `Úkol typu ${task.type ?? "custom"} není podporován: ${task.title}`);
    helpers.updateExplanation({
      currentActivity: "Úkol nelze vykonat.",
      findings: `Pro úkol "${task.title}" není dostupná žádná strategie.`,
      nextStep: "Zkontrolujte typ úkolu nebo nástroje agenta.",
    });
    await helpers.reportProgress(100);
    return {
      status: "cancelled",
      output: `Úkol typu ${task.type ?? "custom"} není podporován.`,
      metadata: { taskType: task.type, reason: "unsupported_task_type" },
    };
  }

  private async executeTool(
    toolId: string,
    input: Record<string, unknown>,
    context: ToolContext,
    toolCalls: ToolCall[],
  ): Promise<unknown> {
    const call: ToolCall = {
      toolId,
      input,
      startedAt: new Date().toISOString(),
    };
    try {
      const output = await this.deps.toolRegistry.execute(toolId, input, context);
      call.output = typeof output === "object" && output !== null ? (output as Record<string, unknown>) : { value: output };
      call.completedAt = new Date().toISOString();
      toolCalls.push(call);
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      call.error = message;
      call.completedAt = new Date().toISOString();
      toolCalls.push(call);
      throw error;
    }
  }

  private extractQuery(task: AgentTask): string | undefined {
    const text = task.description ?? task.title;
    if (!text) return undefined;

    const cleaned = text
      .replace(/^(najdi|hledej|vyhledej|najděte|hledejte|vyhledejte|find|search)\s+/i, "")
      .replace(/\s+(v|ve|všech|všechny|dokumentech|souborech|poznámkách|notes|documents|files)$/i, "")
      .trim();

    return cleaned.length > 0 ? cleaned : undefined;
  }

  private formatSearchResult(
    query: string,
    matchCount: number,
    totalNotes: number,
    readResults: Array<{ title: string; content: string }>,
  ): string {
    const lines: string[] = [
      `Hledal jsem "${query}" v ${totalNotes} poznámkách.`,
      `Nalezl jsem ${matchCount} shod.`,
      "",
    ];

    if (readResults.length === 0) {
      lines.push("Žádný z nalezených souborů nebyl možné přečíst.");
    } else {
      lines.push("Přečetl jsem následující soubory:");
      for (const result of readResults) {
        const preview = result.content.replace(/\s+/g, " ").slice(0, 200);
        lines.push(`- **${result.title}**: ${preview}...`);
      }
    }

    return lines.join("\n");
  }

  private extractLocation(task: AgentTask): string | undefined {
    const text = task.description ?? task.title ?? "";
    const lower = text.toLowerCase();

    const cityMap: Record<string, string> = {
      praha: "Prague",
      praze: "Prague",
      brno: "Brno",
      brně: "Brno",
      ostrava: "Ostrava",
      ostravě: "Ostrava",
      plzeň: "Plzeň",
      plzni: "Plzeň",
      liberec: "Liberec",
      liberci: "Liberec",
      olomouc: "Olomouc",
      olomouci: "Olomouc",
      ústí: "Usti nad Labem",
      "ústí nad labem": "Usti nad Labem",
      hradec: "Hradec Kralove",
      "hradec králové": "Hradec Kralove",
      pardubice: "Pardubice",
      zlín: "Zlin",
      karlovy: "Karlovy Vary",
      "karlovy vary": "Karlovy Vary",
    };

    for (const [czech, english] of Object.entries(cityMap)) {
      if (lower.includes(czech)) {
        return english;
      }
    }

    const knownPatterns = [
      /(?:v|ve|pro)\s+([A-Z][A-Za-z\s-]{1,30})(?:\?|\.|$)/,
      /(?:v|ve|pro)\s+([A-Z][A-Za-z\s-]{1,30})/,
    ];
    for (const pattern of knownPatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const trimmed = match[1].trim();
        if (trimmed.length > 1) return trimmed;
      }
    }

    const withoutPrefix = text
      .replace(/^(najdi|hledej|vyhledej|najděte|hledejte|vyhledejte|find|search|zjisti|jaká je)\s+/i, "")
      .replace(/\s+(počasí|předpověď|vítr|větru|teplota|weather|wind|forecast|temperature)/gi, "")
      .trim();

    if (withoutPrefix.length > 1 && /^[A-Za-z\s-]+$/.test(withoutPrefix)) {
      return withoutPrefix;
    }

    return undefined;
  }

  private formatWeatherResult(
    location: string,
    days: Array<{ date: string; maxWindSpeedKmh: number; maxWindGustsKmh: number; dominantWindDirection: number }>,
  ): string {
    const direction = (deg: number): string => {
      const dirs = ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"];
      return dirs[Math.round(deg / 45) % 8] ?? "?";
    };

    const lines: string[] = [`Předpověď větru pro **${location}** (zdroj Open-Meteo):`, ""];
    for (const day of days) {
      lines.push(
        `- **${day.date}**: max vítr ${Math.round(day.maxWindSpeedKmh)} km/h, nárazy až ${Math.round(day.maxWindGustsKmh)} km/h, směr ${direction(day.dominantWindDirection)}`,
      );
    }
    return lines.join("\n");
  }
}
