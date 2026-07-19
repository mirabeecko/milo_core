import { existsSync } from "node:fs";
import { get } from "node:http";
import type { Agent, AgentTask, LiveWorkExplanation, TaskLogEntry, TaskResult, ToolCall } from "@milo/shared";
import type { ToolContext, ToolRegistry } from "@milo/tools";
import type { AgentEventBus, TaskQueue, TaskRunner, TaskRunnerCallbacks } from "../types.js";
import type { AiMessage, ModelRouter } from "@milo/ai";
import { getSafetyEngine, type AgentWorkMode } from "./safety-rules-engine.js";

export interface ExecutionTaskRunnerDeps {
  queue: TaskQueue;
  eventBus: AgentEventBus;
  toolRegistry: ToolRegistry;
  aiRouter?: ModelRouter;
  vaultPath?: string;
  projectPath?: string;
}

export interface ExecutionPlanStep {
  toolId: string;
  input: Record<string, unknown>;
  description: string;
}

export interface ExecutionPlan {
  steps: ExecutionPlanStep[];
}

export class ExecutionTaskRunner implements TaskRunner {
  constructor(private deps: ExecutionTaskRunnerDeps) {}

  async execute(
    task: AgentTask,
    agent: Agent,
    callbacks?: TaskRunnerCallbacks,
  ): Promise<Record<string, unknown>> {
    process.stdout.write(`[AGENT] ExecutionTaskRunner.execute START: ${task.id} type=${task.type}`);
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

      // ── SAFETY RULES ENGINE ──────────────────────────────────
      const safety = getSafetyEngine();
      const check = safety.beforeTask(task, agent);
      if (!check.allowed) {
        addLog("warn", `SAFETY BLOCK: ${check.reason}`);
        throw new Error(check.reason);
      }
      // Kontrola chráněných souborů pro filesystem tooly
      if (task.toolCalls) {
        for (const tc of task.toolCalls) {
          const fileCheck = safety.checkToolScope(tc.toolId, tc.input, agent.id);
          if (!fileCheck.allowed) {
            addLog("warn", `SAFETY BLOCK: ${fileCheck.reason}`);
            throw new Error(fileCheck.reason);
          }
          // Scope creep check
          const scopeCheck = safety.checkScope(
            (tc.input.path || tc.input.file || tc.input.filePath || "") as string,
            agent.id,
          );
          if (!scopeCheck.allowed) {
            addLog("warn", `SAFETY BLOCK: ${scopeCheck.reason}`);
            throw new Error(scopeCheck.reason);
          }
        }
      }

      const result = await this.runStrategy(task, agent, context, {
        log,
        toolCalls,
        addLog,
        reportProgress,
        updateExplanation,
      });

      process.stdout.write(`[AGENT] execute: runStrategy returned: ${JSON.stringify(result).slice(0,200)}\n`);

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

      // We already have the result from runStrategy — skip queue/eventBus for now
      // await this.deps.queue.complete(job.id, completedResult);
      // try { await this.deps.eventBus.publish({...}); } catch {}

      // ── SAFETY: zaznamenej dokončený task ──────────────────
      getSafetyEngine().afterTask(agent.id, task);

      return completedResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stdout.write(`[AGENT] execute ERROR: ${message} ${error instanceof Error ? error.stack : ""}\n`);
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
    process.stdout.write(`[AGENT] runStrategy START: ${task.title} type: ${task.type}\n`);
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
      case "email":
        return this.executeEmail(task, agent, context, helpers);
      case "calendar":
        return this.executeCalendar(task, agent, context, helpers);
      default: {
        const isEmailQuery = /email|mail|e-mail/.test(text);
        const isCalendarQuery = /kalendář|calendar|událost/i.test(text);
        if (isEmailQuery) return this.executeEmail(task, agent, context, helpers);
        if (isCalendarQuery) return this.executeCalendar(task, agent, context, helpers);
        return isWeatherQuery
          ? this.executeWeather(task, agent, context, helpers)
          : this.executeCustom(task, agent, context, helpers);
      }
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
      addLog("warn", "Obsidian vault není nakonfigurován, používám lokální docs složku");
      context = { ...context, vaultPath: "/Users/mb/dev/MiLO_Core/docs" };
    } else if (!existsSync(context.vaultPath)) {
      const fallbackPath = "/Users/mb/dev/MiLO_Core/docs";
      addLog("warn", `Obsidian vault "${context.vaultPath}" neexistuje, používám fallback: ${fallbackPath}`);
      context = { ...context, vaultPath: fallbackPath };
    }

    addLog("info", `Pracuji s vault: ${context.vaultPath}`);
    updateExplanation({ currentActivity: "Otevírám zdroj poznámek", nextStep: "Projdu seznam poznámek" });
    await reportProgress(15);

    let notes: unknown[] = [];
    try {
      const listResult = await this.executeTool("obsidian:list", { maxResults: 1000 }, context, toolCalls);
      notes = Array.isArray(listResult) ? listResult : [];
      addLog("info", `Nalezeno ${notes.length} poznámek v adresáři`);
    } catch {
      addLog("warn", `Nepodařilo se vypsat poznámky z: ${context.vaultPath}`);
    }

    updateExplanation({
      currentActivity: `Analyzuji ${notes.length} souborů`,
      findings: `Nalezeno ${notes.length} položek`,
      nextStep: `Vyhledám "${query}"`,
    });
    await reportProgress(30);

    let matches: unknown[] = [];
    try {
      const searchResult = await this.executeTool("obsidian:search", { query }, context, toolCalls);
      matches = Array.isArray(searchResult) ? searchResult : [];
      addLog("info", `Nalezeno ${matches.length} shod pro "${query}"`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addLog("warn", `Vyhledávání selhalo: ${msg}. Pokračuji bez výsledků vyhledávání.`);
    }
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

    let forecast: unknown;
    try {
      forecast = await this.executeTool(
        "weather:forecast",
        { location, days: 3 },
        context,
        toolCalls,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog("error", `Weather API selhalo: ${message}`);
      return {
        output: `⚠️ Nepodařilo se získat předpověď pro ${location}: ${message}. Zkontrolujte připojení nebo dostupnost weather nástroje.`,
        metadata: { location, error: message, fallback: true },
      };
    }

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
    context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const query = this.extractQuery(task) ?? task.title;
    helpers.addLog("info", `Analyzuji: "${query}"`);

    if (!context.vaultPath) {
      return {
        output: `Analýza "${task.title}": vault není nakonfigurován. Použijte vaultPath pro vyhledávání v poznámkách.`,
        metadata: { taskType: task.type, vaultMissing: true },
      };
    }

    const plan: ExecutionPlan = {
      steps: [
        { toolId: "obsidian:list", input: { maxResults: 1000 }, description: "Procházím vault" },
        { toolId: "obsidian:search", input: { query }, description: `Hledám "${query}"` },
        { toolId: "filesystem:list", input: { dirPath: context.projectPath ?? "." }, description: "Procházím projektové soubory" },
      ],
    };

    const results = await this.executePlan(plan, context, helpers);

    const obsidianList = results.find((r) => r.step.toolId === "obsidian:list");
    const searchResult = results.find((r) => r.step.toolId === "obsidian:search");
    const fsList = results.find((r) => r.step.toolId === "filesystem:list");

    const vaultNotes = Array.isArray(obsidianList?.output) ? obsidianList.output.length : 0;
    const matches = Array.isArray(searchResult?.output) ? searchResult.output : [];
    const fsEntries = Array.isArray(fsList?.output) ? fsList.output.length : 0;

    const readResults: Array<{ title: string; content: string }> = [];
    for (const m of matches.slice(0, 5)) {
      if (m && typeof m.filePath === "string") {
        try {
          const content = await this.executeTool("obsidian:read", { filePath: m.filePath }, context, helpers.toolCalls);
          readResults.push({ title: m.title ?? m.filePath, content: typeof content === "string" ? content : JSON.stringify(content) });
        } catch {
          helpers.addLog("warn", `Nepodařilo se přečíst ${m.filePath}`);
        }
      }
    }

    const citations = matches.slice(0, 10).map((n: unknown) => {
      const note = n as { filePath?: string; title?: string };
      return note?.filePath ?? note?.title ?? "";
    }).filter(Boolean);

    const output = [
      `Analýza "${query}" dokončena.`,
      `- Vault: ${vaultNotes} poznámek, ${matches.length} shod, přečteno ${readResults.length}`,
      `- Projekt: ${fsEntries} souborů`,
      readResults.length > 0 ? "\nPřečtené soubory:" : "",
      ...readResults.map((r) => `  - **${r.title}**: ${r.content.replace(/\s+/g, " ").slice(0, 300)}`),
    ].filter(Boolean).join("\n");

    return { output, citations, metadata: { query, vaultNotes, matchCount: matches.length, readCount: readResults.length, fsEntries } };
  }

  private async executeSummarize(
    task: AgentTask,
    _agent: Agent,
    context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const query = this.extractQuery(task) ?? task.title;
    helpers.addLog("info", `Shrnuji: "${query}"`);

    if (!context.vaultPath) {
      return {
        output: `Shrnutí "${task.title}": vault není nakonfigurován. ${task.description ?? ""}`,
        metadata: { taskType: task.type, vaultMissing: true },
      };
    }

    const plan: ExecutionPlan = {
      steps: [
        { toolId: "obsidian:search", input: { query }, description: `Hledám dokumenty k "${query}"` },
      ],
    };

    const results = await this.executePlan(plan, context, helpers);
    const searchResult = results.find((r) => r.step.toolId === "obsidian:search");
    const matches = Array.isArray(searchResult?.output) ? searchResult.output : [];

    const readResults: Array<{ title: string; content: string }> = [];
    for (const m of matches.slice(0, 8)) {
      if (m && typeof m.filePath === "string") {
        try {
          const content = await this.executeTool("obsidian:read", { filePath: m.filePath }, context, helpers.toolCalls);
          readResults.push({ title: m.title ?? m.filePath, content: typeof content === "string" ? content : JSON.stringify(content) });
        } catch {
          helpers.addLog("warn", `Nepodařilo se přečíst ${m.filePath}`);
        }
      }
    }

    const combined = readResults.map((r) => `${r.title}:\n${r.content.slice(0, 500)}`).join("\n\n---\n\n");
    const output = `Shrnutí "${query}":\n\nProhledáno ${matches.length} dokumentů, přečteno ${readResults.length}.\n\n${combined}`;

    return { output, metadata: { query, matchCount: matches.length, readCount: readResults.length } };
  }

  private async executeReport(
    task: AgentTask,
    _agent: Agent,
    context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const query = this.extractQuery(task) ?? task.title;
    helpers.addLog("info", `Sestavuji report: "${query}"`);

    const steps: ExecutionPlanStep[] = [];

    if (context.vaultPath) {
      steps.push({ toolId: "obsidian:list", input: { maxResults: 500 }, description: "Vypisuji poznámky ve vaultu" });
      steps.push({ toolId: "obsidian:search", input: { query }, description: `Hledám "${query}" ve vaultu` });
    }

    if (context.projectPath) {
      steps.push({ toolId: "filesystem:list", input: { dirPath: context.projectPath, recursive: true }, description: "Procházím projektovou strukturu" });
    }

    if (steps.length === 0) {
      return {
        output: `Report "${task.title}": žádné zdroje nejsou k dispozici. Nakonfigurujte vaultPath nebo projectPath.`,
        metadata: { taskType: task.type },
      };
    }

    const plan: ExecutionPlan = { steps };
    const results = await this.executePlan(plan, context, helpers);

    const vaultNotes = results.filter((r) => r.step.toolId === "obsidian:list" || r.step.toolId === "obsidian:search");
    const fsEntries = results.filter((r) => r.step.toolId === "filesystem:list");

    const readResults: Array<{ title: string; content: string }> = [];
    for (const vr of vaultNotes) {
      const matches = Array.isArray(vr.output) ? vr.output : [];
      for (const m of matches.slice(0, 4)) {
        if (m && typeof m.filePath === "string") {
          try {
            const content = await this.executeTool("obsidian:read", { filePath: m.filePath }, context, helpers.toolCalls);
            readResults.push({ title: m.title ?? m.filePath, content: typeof content === "string" ? content : JSON.stringify(content) });
          } catch {
            // skip unreadable
          }
        }
      }
    }

    const citations = readResults.map((r) => r.title);
    const output = [
      `# Report: ${query}`,
      "",
      `## Zdroje`,
      `- Vault: ${vaultNotes.length} prohledaných zdrojů`,
      `- Projekt: ${fsEntries.flatMap((r) => Array.isArray(r.output) ? [r.output.length] : []).reduce((a, b) => a + b, 0) || 0} souborů`,
      `- Přečteno: ${readResults.length} dokumentů`,
      "",
      "## Obsah",
      ...readResults.map((r) => `### ${r.title}\n${r.content.slice(0, 800)}\n`),
    ].join("\n");

    return { output, citations, metadata: { query, readCount: readResults.length } };
  }

  private async executeDelegate(
    task: AgentTask,
    _agent: Agent,
    context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    helpers.addLog("info", `Analyzuji delegaci: "${task.title}"`);

    const availableTools = this.deps.toolRegistry.list();
    const toolCategories = [...new Set(availableTools.map((t) => t.id.split(":")[0]))];

    const text = (task.description ?? task.title).toLowerCase();
    const categoryMap: Record<string, string> = {
      obsidian: "Knowledge Agent",
      knowledge: "Knowledge Agent",
      filesystem: "Developer Agent",
      shell: "Developer Agent",
      github: "Developer Agent",
      code: "Developer Agent",
      build: "Developer Agent",
      deploy: "Automation Agent",
      weather: "Research Agent",
      web: "Research Agent",
      search: "Research Agent",
      document: "Document Agent",
      pdf: "Document Agent",
      communication: "Communication Agent",
      email: "Communication Agent",
      message: "Communication Agent",
      calendar: "Calendar Agent",
      schedule: "Calendar Agent",
      time: "Calendar Agent",
      legal: "Legal Agent",
      contract: "Legal Agent",
      compliance: "Legal Agent",
      archive: "Document Agent",
      backup: "Automation Agent",
      monitor: "Automation Agent",
      report: "Chief of Staff",
      coordinate: "Chief of Staff",
    };

    const matchedCategories: string[] = [];
    for (const [keyword, agentName] of Object.entries(categoryMap)) {
      if (text.includes(keyword) || toolCategories.includes(keyword)) {
        if (!matchedCategories.includes(agentName)) {
          matchedCategories.push(agentName);
        }
      }
    }

    if (matchedCategories.length === 0) {
      matchedCategories.push("Chief of Staff (výchozí)");
    }

    const output = [
      `Delegační analýza pro "${task.title}":`,
      `- Dostupných nástrojů: ${availableTools.length} (${toolCategories.join(", ")})`,
      `- Doporučení agenti: ${matchedCategories.join(", ")}`,
      "",
      `Na základě analýzy doporučuji delegovat na: **${matchedCategories[0]}**.`,
    ].join("\n");

    return { output, metadata: { taskType: task.type, toolCount: availableTools.length, toolCategories, recommendations: matchedCategories } };
  }

  private async executeCustom(
    task: AgentTask,
    _agent: Agent,
    context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    const text = (task.description ?? task.title).toLowerCase();
    helpers.addLog("info", `Vykonávám vlastní úkol: "${task.title}"`);
    process.stdout.write(`[AGENT] executeCustom START: ${task.title}\n`);

    // Email detection
    if (/email|mail|e-mail/.test(text)) {
      return this.executeEmail(task, _agent, context, helpers);
    }

    // Calendar detection
    if (/kalendář|calendar|událost/i.test(text)) {
      return this.executeCalendar(task, _agent, context, helpers);
    }

    // Early fallback: simple custom tasks with no vaultPath and no specific tool keywords
    // return a text response without calling any tool registry
    const hasSpecificToolKeywords =
      text.includes("soubor") || text.includes("file") || text.includes("čti") || text.includes("read") ||
      text.includes("složk") || text.includes("adresář") || text.includes("list") || text.includes("ls") ||
      text.includes("shell") || text.includes("příkaz") || text.includes("command") || text.includes("exec") || text.includes("spusť") ||
      text.includes("poznámk") || text.includes("note") || text.includes("obsidian") || text.includes("vault");

    if (!hasSpecificToolKeywords) {
      process.stdout.write(`[AGENT] executeCustom: early fallback for ${task.title}\n`);
      helpers.addLog("info", `Jednoduchý custom úkol — vracím textovou odpověď bez nástrojů`);
      return {
        output: `Úkol splněn: ${task.title}`,
        metadata: {},
      };
    }

    const toolHints: Array<{ toolId: string; input: Record<string, unknown>; description: string }> = [];

    if (text.includes("soubor") || text.includes("file") || text.includes("čti") || text.includes("read")) {
      const match = text.match(/soubor[:\s]+([^\s,]+)/i) ?? text.match(/souboru[:\s]+([^\s,]+)/i);
      const filePath = match?.[1];
      toolHints.push({
        toolId: "filesystem:read",
        input: { filePath: filePath ?? "." },
        description: "Čtu soubor",
      });
    }

    if (text.includes("složk") || text.includes("adresář") || text.includes("list") || text.includes("ls")) {
      toolHints.push({
        toolId: "filesystem:list",
        input: { dirPath: context.projectPath ?? ".", recursive: text.includes("rekurzivn") },
        description: "Vypisuji souborový systém",
      });
    }

    if (text.includes("shell") || text.includes("příkaz") || text.includes("command") || text.includes("exec") || text.includes("spusť")) {
      const cmdMatch = text.match(/(?:příkaz|command|exec|spusť)[:\s]+([^\n,;]+)/i);
      toolHints.push({
        toolId: "shell:execute",
        input: { command: cmdMatch?.[1] ?? "echo 'no command specified'" },
        description: "Spouštím shell příkaz",
      });
    }

    if (context.vaultPath && (text.includes("poznámk") || text.includes("note") || text.includes("obsidian") || text.includes("vault"))) {
      const query = this.extractQuery(task) ?? task.title;
      toolHints.push({
        toolId: "obsidian:search",
        input: { query },
        description: `Hledám "${query}" v poznámkách`,
      });
    }

    if (toolHints.length === 0) {
      const availableTools = this.deps.toolRegistry.list();
      helpers.addLog("info", `Žádné specifické nástroje nenalezeny v popisu. K dispozici: ${availableTools.map((t) => t.id).join(", ")}.`);

      if (context.vaultPath) {
        const query = this.extractQuery(task) ?? task.title;
        toolHints.push({
          toolId: "obsidian:search",
          input: { query },
          description: `Hledám "${query}" v poznámkách`,
        });
      } else if (context.projectPath) {
        toolHints.push({
          toolId: "filesystem:list",
          input: { dirPath: context.projectPath },
          description: "Procházím projektové soubory",
        });
      }
    }

    if (toolHints.length === 0) {
      return {
        output: `Úkol "${task.title}" vykonán bez nástrojů. ${task.description ?? ""}`,
        metadata: { taskType: task.type, toolsAvailable: this.deps.toolRegistry.list().map((t) => t.id) },
      };
    }

    const plan: ExecutionPlan = { steps: toolHints };
    const results = await this.executePlan(plan, context, helpers);

    const parts = results.map((r) => {
      const out = typeof r.output === "string" ? r.output : JSON.stringify(r.output, null, 2);
      return `### ${r.step.toolId}\n${out.slice(0, 1000)}`;
    });

    return {
      output: `Vlastní úkol "${task.title}" proveden:\n\n${parts.join("\n\n")}`,
      metadata: { taskType: task.type, stepsExecuted: results.length, toolIds: toolHints.map((h) => h.toolId) },
    };
  }

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          } else {
            resolve(data);
          }
        });
      }).on("error", reject);
    });
  }

  private async executeEmail(
    task: AgentTask,
    _agent: Agent,
    _context: ToolContext,
    { addLog, reportProgress, updateExplanation }: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    process.stdout.write("[AGENT] executeEmail START\n");
    addLog("info", `Načítám emaily z API bridge...`);
    updateExplanation({ currentActivity: "Připojuji se k emailovému API", nextStep: "Stahuji inbox" });
    await reportProgress(20);

    try {
      const raw = await this.httpGet("http://localhost:4000/email/inbox");
      const parsed = JSON.parse(raw) as {
        total: number;
        emails: Array<{ id: string; subject: string; from: string; date: string; snippet: string; unread: boolean; important: boolean }>;
        summary: { aiSummary: string; unread: number; important: number };
      };

      const { total, summary } = parsed;
      addLog("info", `Načteno ${total} emailů (nepřečtených: ${summary.unread}, důležitých: ${summary.important})`);
      updateExplanation({
        currentActivity: "Analyzuji emaily",
        findings: `${total} emailů — ${summary.unread} nepřečtených, ${summary.important} důležitých`,
        nextStep: "Připravuji shrnutí",
      });
      await reportProgress(80);

      const output = [
        `📧 **Email přehled** (${total} zpráv, ${summary.unread} nepřečtených, ${summary.important} důležitých)`,
        "",
        "---",
        "",
        summary.aiSummary,
      ].join("\n");

      return {
        output,
        metadata: {
          source: "email/inbox",
          total: parsed.total,
          unread: summary.unread,
          important: summary.important,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog("error", `Nepodařilo se načíst emaily: ${message}`);
      return {
        output: `⚠️ Nepodařilo se načíst emaily: ${message}. Zkontrolujte, zda API bridge běží na localhost:4000.`,
        metadata: { source: "email/inbox", error: message },
      };
    }
  }

  private async executeCalendar(
    task: AgentTask,
    _agent: Agent,
    _context: ToolContext,
    { addLog, reportProgress, updateExplanation }: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<TaskResult & { metadata?: Record<string, unknown> }> {
    addLog("info", `Načítám kalendář z API bridge...`);
    updateExplanation({ currentActivity: "Připojuji se ke kalendářovému API", nextStep: "Stahuji události" });
    await reportProgress(20);

    try {
      const raw = await this.httpGet("http://localhost:4000/calendar/events");
      const parsed = JSON.parse(raw) as {
        total: number;
        events: Array<{ id: string; title: string; start: string; end: string; location?: string; description?: string }>;
        summary: { aiSummary: string; today: number; tomorrow: number };
      };

      const { total, summary } = parsed;
      addLog("info", `Načteno ${total} událostí (dnes: ${summary.today}, zítra: ${summary.tomorrow})`);
      updateExplanation({
        currentActivity: "Analyzuji kalendář",
        findings: `${total} událostí — ${summary.today} dnes, ${summary.tomorrow} zítra`,
        nextStep: "Připravuji shrnutí",
      });
      await reportProgress(80);

      const output = [
        `📅 **Kalendář — přehled** (${total} událostí, ${summary.today} dnes, ${summary.tomorrow} zítra)`,
        "",
        "---",
        "",
        summary.aiSummary,
      ].join("\n");

      return {
        output,
        metadata: {
          source: "calendar/events",
          total: parsed.total,
          today: summary.today,
          tomorrow: summary.tomorrow,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog("error", `Nepodařilo se načíst kalendář: ${message}`);
      return {
        output: `⚠️ Nepodařilo se načíst kalendář: ${message}. Zkontrolujte, zda API bridge běží na localhost:4000.`,
        metadata: { source: "calendar/events", error: message },
      };
    }
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

  protected async executePlan(
    plan: ExecutionPlan,
    context: ToolContext,
    helpers: {
      addLog: (level: TaskLogEntry["level"], message: string, metadata?: Record<string, unknown>) => void;
      reportProgress: (progress: number) => Promise<void>;
      updateExplanation: (partial: Partial<LiveWorkExplanation>) => void;
      toolCalls: ToolCall[];
    },
  ): Promise<Array<{ step: ExecutionPlanStep; output: unknown }>> {
    const results: Array<{ step: ExecutionPlanStep; output: unknown }> = [];
    const total = plan.steps.length;

    for (let i = 0; i < total; i++) {
      const step = plan.steps[i];
      const stepNum = i + 1;
      helpers.addLog("info", `Krok ${stepNum}/${total}: ${step.description}`);
      helpers.updateExplanation({
        currentActivity: step.description,
        nextStep: i + 1 < total ? plan.steps[i + 1].description : "Dokončuji",
      });
      helpers.reportProgress(Math.round((stepNum / total) * 100));

      try {
        const output = await this.executeTool(step.toolId, step.input, context, helpers.toolCalls);
        results.push({ step, output });
        helpers.addLog("info", `Krok ${stepNum} dokončen: ${step.toolId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        helpers.addLog("error", `Krok ${stepNum} selhal (${step.toolId}): ${message}`);
        helpers.updateExplanation({
          currentActivity: `Krok ${stepNum} selhal: ${message}`,
          findings: `Nástroj ${step.toolId} vrátil chybu`,
          nextStep: "Pokračuji s dostupnými výsledky",
        });
        results.push({ step, output: { error: message } });
      }
    }

    return results;
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

  // ── Safety Rules Engine helpers ─────────────────────────────

  /** Nastav režim práce agenta (analyze/plan/implement/verify/recovery) */
  setAgentMode(agentId: string, mode: AgentWorkMode): void {
    getSafetyEngine().setMode(agentId, mode);
  }

  /** Zaregistruj plánované soubory pro scope kontrolu */
  planFiles(agentId: string, files: string[]): void {
    getSafetyEngine().registerPlannedFiles(agentId, files);
  }

  /** Vrať safety report pro agenta */
  getSafetyReport(agentId: string) {
    return getSafetyEngine().getSessionReport(agentId);
  }

  /** Resetuj safety stav agenta */
  resetSafety(agentId: string): void {
    getSafetyEngine().resetAgent(agentId);
  }
}

export function buildExecutionPlan(
  taskType: string,
  task: AgentTask,
  toolRegistry: ToolRegistry,
): ExecutionPlan {
  const allTools = toolRegistry.list();
  const hasObsidian = allTools.some((t) => t.id.startsWith("obsidian:"));
  const hasFilesystem = allTools.some((t) => t.id.startsWith("filesystem:"));

  const query = (task.description ?? task.title).trim();
  const text = (task.description ?? task.title).toLowerCase();

  switch (taskType) {
    case "search":
    case "analyze": {
      const steps: ExecutionPlanStep[] = [];
      if (hasObsidian) {
        steps.push({ toolId: "obsidian:list", input: { maxResults: 500 }, description: "Vypisuji poznámky" });
        steps.push({ toolId: "obsidian:search", input: { query }, description: `Hledám "${query}"` });
      }
      if (hasFilesystem) {
        steps.push({ toolId: "filesystem:list", input: { dirPath: "." }, description: "Procházím soubory" });
      }
      return { steps: steps.length > 0 ? steps : [{ toolId: "obsidian:list", input: { maxResults: 100 }, description: "Vypisuji poznámky" }] };
    }

    case "summarize": {
      const steps: ExecutionPlanStep[] = [];
      if (hasObsidian) {
        steps.push({ toolId: "obsidian:search", input: { query }, description: `Hledám dokumenty k "${query}"` });
      }
      return { steps: steps.length > 0 ? steps : [{ toolId: "filesystem:list", input: { dirPath: ".", recursive: true }, description: "Procházím soubory" }] };
    }

    case "report": {
      const steps: ExecutionPlanStep[] = [];
      if (hasObsidian) {
        steps.push({ toolId: "obsidian:list", input: { maxResults: 500 }, description: "Vypisuji poznámky" });
        steps.push({ toolId: "obsidian:search", input: { query }, description: `Hledám "${query}"` });
      }
      if (hasFilesystem) {
        steps.push({ toolId: "filesystem:list", input: { dirPath: ".", recursive: true }, description: "Procházím strukturu" });
      }
      return { steps: steps.length > 0 ? steps : [{ toolId: "filesystem:list", input: { dirPath: ".", recursive: true }, description: "Procházím strukturu" }] };
    }

    case "delegate": {
      const toolCategories = [...new Set(allTools.map((t) => t.id.split(":")[0]))];
      return {
        steps: [{
          toolId: hasObsidian ? "obsidian:list" : "filesystem:list",
          input: hasObsidian ? { maxResults: 100 } : { dirPath: "." },
          description: `Inventarizace nástrojů: ${toolCategories.join(", ")}`,
        }],
      };
    }

    case "email": {
      return {
        steps: [{
          toolId: "email:inbox",
          input: {},
          description: "Načítám emaily z API bridge",
        }],
      };
    }

    case "calendar": {
      return {
        steps: [{
          toolId: "calendar:events",
          input: {},
          description: "Načítám kalendář z API bridge",
        }],
      };
    }

    case "custom":
    default: {
      const steps: ExecutionPlanStep[] = [];
      if (text.includes("soubor") || text.includes("file")) {
        steps.push({ toolId: "filesystem:read", input: { filePath: "." }, description: "Čtu soubor" });
      }
      if (text.includes("shell") || text.includes("příkaz") || text.includes("exec")) {
        steps.push({ toolId: "shell:execute", input: { command: "echo ready" }, description: "Spouštím shell" });
      }
      if (hasObsidian && (text.includes("poznámk") || text.includes("note"))) {
        steps.push({ toolId: "obsidian:search", input: { query }, description: `Hledám "${query}"` });
      }
      if (steps.length === 0) {
        steps.push(hasFilesystem
          ? { toolId: "filesystem:list", input: { dirPath: ".", recursive: true }, description: "Procházím soubory" }
          : { toolId: "obsidian:list", input: { maxResults: 100 }, description: "Vypisuji poznámky" });
      }
      return { steps };
    }
  }
}

