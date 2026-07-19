import type { AgentManager } from "@milo/agents";

export type ExportFormat = "json" | "markdown";

export interface ExportMetadata {
  exportDate: string;
  miLOVersion: string;
  schemaVersion: string;
  exportedBy: string;
}

export interface ExportBundle {
  metadata: ExportMetadata;
  agents: {
    definitions: unknown[];
    states: unknown[];
    logs: unknown[];
    memory: unknown[];
    metrics: unknown[];
  };
  missions: unknown[];
  tasks: unknown[];
  knowledge: {
    obsidianIndex?: unknown;
    documents?: unknown;
  };
  config: unknown;
  events: unknown[];
}

function sanitizeForExport(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.toLowerCase().includes("secret") || key.toLowerCase().includes("password") || key.toLowerCase().includes("token")) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

function stripApiKeys(config: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (key.endsWith("_KEY") || key.endsWith("_SECRET") || key.toUpperCase() === "JWT_SECRET") {
      safe[key] = "***REDACTED***";
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

export class ExportService {
  constructor(private agentManager: AgentManager) {}

  async exportAgentData(format: ExportFormat): Promise<string> {
    const agents = this.agentManager.listAgents();
    const data = {
      exportDate: new Date().toISOString(),
      schemaVersion: "1.0",
      agents: await Promise.all(
        agents.map(async (entity) => {
          const state = entity.getState();
          const logs = await this.agentManager.getLogs(entity.id);
          const memory = await this.agentManager.getMemory(entity.id);
          const metrics = await this.agentManager.getMetrics(entity.id);
          return {
            id: entity.id,
            agent: entity.agent,
            state,
            logs,
            memory,
            metrics,
            taskHistory: entity.getTaskHistory(),
            pendingQueue: entity.getPendingQueue(),
          };
        }),
      ),
    };

    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }

    return this.agentDataToMarkdown(data);
  }

  async exportMissions(format: ExportFormat): Promise<string> {
    const missions = await this.agentManager.getMissions();
    const data = {
      exportDate: new Date().toISOString(),
      schemaVersion: "1.0",
      missions,
    };

    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }

    return this.missionsToMarkdown(data);
  }

  async exportKnowledge(format: ExportFormat): Promise<string> {
    const knowledge: { obsidianIndex?: unknown; documents?: unknown } = {};

    try {
      const indexer = (this.agentManager as unknown as { indexer?: { getIndex(): unknown; getNotes(): unknown[] } }).indexer;
      if (indexer) {
        knowledge.obsidianIndex = indexer.getIndex();
      }
    } catch {
      knowledge.obsidianIndex = null;
    }

    const data = {
      exportDate: new Date().toISOString(),
      schemaVersion: "1.0",
      knowledge,
    };

    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }

    return this.knowledgeToMarkdown(data);
  }

  async exportAll(format: ExportFormat): Promise<ExportBundle> {
    const agents = this.agentManager.listAgents();
    const now = new Date().toISOString();

    const metadata: ExportMetadata = {
      exportDate: now,
      miLOVersion: "0.1.0",
      schemaVersion: "1.0",
      exportedBy: "MiLO Export Service",
    };

    const agentsData = await Promise.all(
      agents.map(async (entity) => {
        const state = entity.getState();
        const logs = await this.agentManager.getLogs(entity.id);
        const memory = await this.agentManager.getMemory(entity.id);
        const metrics = await this.agentManager.getMetrics(entity.id);
        return {
          definition: entity.agent,
          state,
          logs,
          memory,
          metrics,
          taskHistory: entity.getTaskHistory(),
          pendingQueue: entity.getPendingQueue(),
        };
      }),
    );

    const missions = await this.agentManager.getMissions();
    const tasks = await this.agentManager.getTasks();
    const events = await this.agentManager.getEvents();

    const knowledge: { obsidianIndex?: unknown } = {};
    try {
      const indexer = (this.agentManager as unknown as { indexer?: { getIndex(): unknown } }).indexer;
      if (indexer) {
        knowledge.obsidianIndex = indexer.getIndex();
      }
    } catch {
      knowledge.obsidianIndex = null;
    }

    const config = stripApiKeys(await this.collectConfig());

    return {
      metadata,
      agents: {
        definitions: agentsData.map((d) => d.definition),
        states: agentsData.map((d) => d.state),
        logs: agentsData.map((d) => d.logs),
        memory: agentsData.map((d) => d.memory),
        metrics: agentsData.map((d) => d.metrics),
      },
      missions,
      tasks,
      knowledge,
      config,
      events,
    };
  }

  async exportAllAsString(format: ExportFormat): Promise<string> {
    const bundle = await this.exportAll(format);

    if (format === "json") {
      return JSON.stringify(bundle, null, 2);
    }

    return this.bundleToMarkdown(bundle);
  }

  private async collectConfig(): Promise<Record<string, unknown>> {
    try {
      const { config } = await import("../config/index.js");
      return { ...config } as unknown as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  // --- Markdown formatters ---

  private agentDataToMarkdown(data: { exportDate: string; schemaVersion: string; agents: unknown[] }): string {
    const lines: string[] = [
      "# Export agentů MiLO",
      "",
      `**Exportováno:** ${data.exportDate}`,
      `**Verze schématu:** ${data.schemaVersion}`,
      "",
      "---",
      "",
    ];

    for (const agent of data.agents) {
      const a = agent as Record<string, unknown>;
      const agentDef = a.agent as Record<string, unknown> | undefined;
      const state = a.state as Record<string, unknown> | undefined;

      lines.push(`## Agent: ${agentDef?.name ?? a.id}`, "");
      lines.push(`- **ID:** \`${a.id}\``);
      lines.push(`- **Role:** ${agentDef?.role ?? "—"}`);
      lines.push(`- **Priorita:** ${agentDef?.priority ?? "—"}`);
      lines.push(`- **Status:** ${state?.status ?? "—"}`);
      lines.push("");

      if (state) {
        lines.push("### Stav", "");
        lines.push("| Klíč | Hodnota |");
        lines.push("|------|---------|");
        for (const [key, value] of Object.entries(state)) {
          if (key !== "explanation") {
            lines.push(`| ${key} | ${formatMdValue(value)} |`);
          }
        }
        lines.push("");

        if (state.explanation) {
          const exp = state.explanation as Record<string, unknown>;
          lines.push("### Live explanation", "");
          lines.push(`- **Aktivita:** ${exp.currentActivity ?? "—"}`);
          lines.push(`- **Cíl:** ${exp.goal ?? "—"}`);
          lines.push(`- **Další krok:** ${exp.nextStep ?? "—"}`);
          lines.push("");
        }
      }

      const taskHistory = a.taskHistory as unknown[] | undefined;
      if (taskHistory && taskHistory.length > 0) {
        lines.push("### Historie úkolů", "");
        for (const task of taskHistory) {
          const t = task as Record<string, unknown>;
          lines.push(`- [${t.status}] ${t.title}`);
        }
        lines.push("");
      }

      const logs = a.logs as unknown[] | undefined;
      if (logs && Array.isArray(logs) && logs.length > 0) {
        lines.push("### Logy (posledních 10)", "");
        for (const log of logs.slice(-10)) {
          const l = log as Record<string, unknown>;
          lines.push(`- \`${l.timestamp}\` [${l.level}] ${l.message}`);
        }
        lines.push("");
      }

      lines.push("---", "");
    }

    return lines.join("\n");
  }

  private missionsToMarkdown(data: { exportDate: string; schemaVersion: string; missions: unknown[] }): string {
    const lines: string[] = [
      "# Export misí MiLO",
      "",
      `**Exportováno:** ${data.exportDate}`,
      `**Verze schématu:** ${data.schemaVersion}`,
      "",
      "---",
      "",
    ];

    for (const mission of data.missions) {
      const m = mission as Record<string, unknown>;
      lines.push(`## ${m.title}`, "");
      lines.push(`- **ID:** \`${m.id}\``);
      lines.push(`- **Status:** ${m.status}`);
      lines.push(`- **Priorita:** ${m.priority}`);
      lines.push(`- **Vytvořeno:** ${m.createdAt}`);
      if (m.startedAt) lines.push(`- **Spuštěno:** ${m.startedAt}`);
      if (m.completedAt) lines.push(`- **Dokončeno:** ${m.completedAt}`);
      if (m.description) lines.push("", `${m.description}`, "");
      if (m.result) {
        lines.push("", "### Výsledek", "", "```json", JSON.stringify(m.result, null, 2), "```", "");
      }
      lines.push("---", "");
    }

    return lines.join("\n");
  }

  private knowledgeToMarkdown(data: { exportDate: string; schemaVersion: string; knowledge: Record<string, unknown> }): string {
    const lines: string[] = [
      "# Export znalostí MiLO",
      "",
      `**Exportováno:** ${data.exportDate}`,
      `**Verze schématu:** ${data.schemaVersion}`,
      "",
      "---",
      "",
    ];

    const obsidianIndex = data.knowledge.obsidianIndex as Record<string, unknown> | undefined;
    if (obsidianIndex) {
      lines.push("## Obsidian Vault Index", "");
      lines.push("```json", JSON.stringify(obsidianIndex, null, 2), "```", "");
    } else {
      lines.push("## Obsidian Vault Index", "");
      lines.push("Obsidian vault není nakonfigurován.", "");
    }

    return lines.join("\n");
  }

  private bundleToMarkdown(bundle: ExportBundle): string {
    const lines: string[] = [
      "# Kompletní export MiLO",
      "",
      `**Exportováno:** ${bundle.metadata.exportDate}`,
      `**MiLO verze:** ${bundle.metadata.miLOVersion}`,
      `**Verze schématu:** ${bundle.metadata.schemaVersion}`,
      `**Exportoval:** ${bundle.metadata.exportedBy}`,
      "",
      "---",
      "",
      "## Konfigurace (bez tajemství)",
      "",
      "```json",
      JSON.stringify(bundle.config, null, 2),
      "```",
      "",
      "---",
      "",
      `## Agenti (${Array.isArray(bundle.agents.definitions) ? bundle.agents.definitions.length : 0})`,
      "",
    ];

    const defs = bundle.agents.definitions as Record<string, unknown>[];
    const states = bundle.agents.states as Record<string, unknown>[];
    const allLogs = bundle.agents.logs as unknown[][];
    const allMemory = bundle.agents.memory as unknown[];

    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      const state = states[i];
      lines.push(`### Agent: ${def?.name ?? "unknown"}`, "");
      lines.push(`- **ID:** \`${def?.id ?? "—"}\``);
      lines.push(`- **Role:** ${def?.role ?? "—"}`);
      lines.push(`- **Status:** ${state?.status ?? "—"}`);
      lines.push(`- **Aktivní úkol:** ${state?.activeTaskId ?? "žádný"}`);
      lines.push(`- **Dokončené úkoly:** ${state?.completedTasks ?? 0}`);
      lines.push(`- **Selhané úkoly:** ${state?.failedTasks ?? 0}`);
      lines.push("");
    }

    lines.push("---", "", `## Mise (${Array.isArray(bundle.missions) ? bundle.missions.length : 0})`, "");

    for (const mission of bundle.missions as Record<string, unknown>[]) {
      lines.push(`- [${mission.status}] ${mission.title} (${mission.id})`);
    }

    lines.push("", "---", "", `## Úkoly (${Array.isArray(bundle.tasks) ? bundle.tasks.length : 0})`, "");

    for (const task of bundle.tasks as Record<string, unknown>[]) {
      lines.push(`- [${task.status}] ${task.title} → ${task.ownerId}`);
    }

    lines.push("", "---", "", "## Události", "", "```json", JSON.stringify(bundle.events, null, 2), "```", "");

    if (bundle.knowledge.obsidianIndex) {
      lines.push("---", "", "## Obsidian Index", "", "```json", JSON.stringify(bundle.knowledge.obsidianIndex, null, 2), "```", "");
    }

    return lines.join("\n");
  }
}

function formatMdValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return "`{...}`";
  return String(value);
}
