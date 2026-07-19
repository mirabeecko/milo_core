#!/usr/bin/env node
import { program } from "commander";
import dotenv from "dotenv";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  InMemoryAgentEventRepository,
  InMemoryAgentLogRepository,
  InMemoryAgentMemoryRepository,
  InMemoryAgentMetricsRepository,
  InMemoryAgentRepository,
  InMemoryMissionRepository,
  InMemoryTaskRepository,
} from "@milo/database";
import { AgentManager, registerDefaultAgents } from "@milo/agents";
import { TtsRegistry } from "@milo/tts";
import { SayTtsProvider } from "@milo/tts/say";

dotenv.config();

let manager: AgentManager | null = null;

async function getManager(): Promise<AgentManager> {
  if (!manager) {
    manager = new AgentManager({
      repositories: {
        agents: new InMemoryAgentRepository(),
        tasks: new InMemoryTaskRepository(),
        missions: new InMemoryMissionRepository(),
        logs: new InMemoryAgentLogRepository(),
        memory: new InMemoryAgentMemoryRepository(),
        metrics: new InMemoryAgentMetricsRepository(),
        events: new InMemoryAgentEventRepository(),
      },
    });
    await registerDefaultAgents(manager);
    await manager.startAll();
  }
  return manager;
}

function createTtsRegistry(): TtsRegistry {
  const registry = new TtsRegistry();
  registry.register(new SayTtsProvider(), true);
  return registry;
}

async function speakIfRequested(text: string, speak: boolean): Promise<void> {
  if (!speak) {
    return;
  }

  const registry = createTtsRegistry();
  const provider = await registry.getFirstAvailable();

  if (!provider) {
    console.error("TTS není dostupné. Odpověď byla vypsána pouze jako text.");
    return;
  }

  await registry.speak(text, { rate: 1.0 });
}

// --- Export helpers (Markdown formatting) ---

function agentsToMarkdown(meta: Record<string, unknown>, agents: unknown[]): string {
  const lines = [
    "# Export agentů MiLO",
    "",
    `**Exportováno:** ${meta.exportDate}`,
    `**Verze schématu:** ${meta.schemaVersion}`,
    "",
    "---",
    "",
  ];
  for (const agent of agents) {
    const a = agent as Record<string, unknown>;
    const def = a.agent as Record<string, unknown> | undefined;
    const state = a.state as Record<string, unknown> | undefined;
    lines.push(`## ${def?.name ?? a.id}`, "");
    lines.push(`- **ID:** \`${a.id}\``);
    lines.push(`- **Role:** ${def?.role ?? "—"}`);
    lines.push(`- **Status:** ${state?.status ?? "—"}`);
    lines.push(`- **Dokončené úkoly:** ${state?.completedTasks ?? 0}`);
    lines.push(`- **Selhané úkoly:** ${state?.failedTasks ?? 0}`);
    lines.push("");
  }
  return lines.join("\n");
}

function missionsToMarkdown(meta: Record<string, unknown>, missions: unknown[]): string {
  const lines = [
    "# Export misí MiLO",
    "",
    `**Exportováno:** ${meta.exportDate}`,
    `**Verze schématu:** ${meta.schemaVersion}`,
    "",
    "---",
    "",
  ];
  for (const mission of missions) {
    const m = mission as Record<string, unknown>;
    lines.push(`## ${m.title}`, "");
    lines.push(`- **ID:** \`${m.id}\``);
    lines.push(`- **Status:** ${m.status}`);
    lines.push(`- **Priorita:** ${m.priority}`);
    lines.push("");
  }
  return lines.join("\n");
}

function fullBundleToMarkdown(bundle: Record<string, unknown>): string {
  const lines = [
    "# Kompletní export MiLO",
    "",
    `**Exportováno:** ${bundle.exportDate}`,
    `**Verze schématu:** ${bundle.schemaVersion}`,
    "",
    "---",
    "",
  ];
  const agents = bundle.agents as unknown[] | undefined;
  if (agents) {
    lines.push(`## Agenti (${agents.length})`, "");
    for (const agent of agents) {
      const a = agent as Record<string, unknown>;
      const def = a.agent as Record<string, unknown> | undefined;
      const state = a.state as Record<string, unknown> | undefined;
      lines.push(`- [${state?.status ?? "?"}] ${def?.name ?? a.id}`);
    }
    lines.push("");
  }
  const missions = bundle.missions as unknown[] | undefined;
  if (missions) {
    lines.push(`## Mise (${missions.length})`, "");
    for (const mission of missions) {
      const m = mission as Record<string, unknown>;
      lines.push(`- [${m.status}] ${m.title}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

program.name("milo").description("MiLO_Core CLI").version("0.1.0");

program
  .command("brief")
  .description("Vygeneruj ranní briefing")
  .option("-s, --speak", "Přečti odpověď nahlas", false)
  .action(async (options: { speak: boolean }) => {
    const mgr = await getManager();
    const agent = mgr.getAgent("chief-of-staff");
    const explanation = agent ? await mgr.getExplanation(agent.id) : null;

    const briefing = explanation
      ? `${explanation.currentActivity}\n${explanation.goal}\n${explanation.nextStep}`
      : `Dobré ráno. Dnes je ${new Date().toLocaleDateString("cs-CZ")}. Nemáte žádné naléhavé schůzky. Doporučuji začít s hlavní prioritou dne.`;

    console.log(briefing);
    await speakIfRequested(briefing, options.speak);
  });

program
  .command("ask")
  .description("Zeptej se MiLO")
  .argument("<question>", "Otázka pro MiLO")
  .option("-s, --speak", "Přečti odpověď nahlas", false)
  .action(async (question: string, options: { speak: boolean }) => {
    const mgr = await getManager();
    const task = await mgr.delegate({
      title: question,
      priority: "normal",
      status: "pending",
      ownerId: "chief-of-staff",
      ownerType: "agent",
      source: "cli",
      log: [],
      toolsUsed: [],
      citations: [],
      retryCount: 0,
      estimateMs: 500,
    });
    console.log(`Úkol vytvořen: ${task.id}`);
    console.log("Odpověď bude dostupná po napojení AI providera.");
    await speakIfRequested(`Vytvořil jsem úkol ${task.id}.`, options.speak);
  });

const agentCommand = program.command("agent").description("Správa agentů");

agentCommand
  .command("list")
  .description("Vypiš všechny agenty")
  .action(async () => {
    const mgr = await getManager();
    const agents = mgr.listAgents();
    console.table(
      agents.map((a) => ({
        id: a.id,
        name: a.agent.name,
        status: a.agent.status,
        role: a.agent.role,
      })),
    );
  });

agentCommand
  .command("start")
  .description("Spusť agenta")
  .argument("<id>", "ID agenta")
  .action(async (id: string) => {
    const mgr = await getManager();
    await mgr.start(id);
    console.log(`Agent ${id} started`);
  });

agentCommand
  .command("stop")
  .description("Zastav agenta")
  .argument("<id>", "ID agenta")
  .action(async (id: string) => {
    const mgr = await getManager();
    await mgr.stop(id);
    console.log(`Agent ${id} stopped`);
  });

agentCommand
  .command("status")
  .description("Zobraz stav agenta")
  .argument("<id>", "ID agenta")
  .action(async (id: string) => {
    const mgr = await getManager();
    const entity = mgr.getAgent(id);
    if (!entity) {
      console.error(`Agent ${id} not found`);
      process.exit(1);
    }
    console.log(JSON.stringify(entity.getState(), null, 2));
  });

agentCommand
  .command("logs")
  .description("Zobraz logy agenta")
  .argument("<id>", "ID agenta")
  .option("-l, --limit <number>", "Počet záznamů", "20")
  .action(async (id: string, options: { limit: string }) => {
    const mgr = await getManager();
    const logs = await mgr.getLogs(id, Number(options.limit));
    console.table(logs.map((l) => ({ time: l.timestamp, level: l.level, message: l.message })));
  });

const taskCommand = program.command("task").description("Správa úkolů");

taskCommand
  .command("list")
  .description("Vypiš úkoly")
  .option("--status <status>", "Filtrovat podle stavu")
  .option("--agent <agentId>", "Filtrovat podle agenta")
  .option("-l, --limit <number>", "Počet záznamů", "50")
  .action(async (options: { status?: string; agent?: string; limit: string }) => {
    const mgr = await getManager();
    const tasks = await mgr.getTasks({
      status: options.status,
      ownerId: options.agent,
      limit: Number(options.limit),
    });
    console.table(
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        ownerId: t.ownerId,
        priority: t.priority,
      })),
    );
  });

taskCommand
  .command("run")
  .description("Spusť nový úkol")
  .argument("<title>", "Název úkolu")
  .option("-a, --agent <agentId>", "Cílový agent", "chief-of-staff")
  .option("-p, --priority <priority>", "Priorita", "normal")
  .action(async (title: string, options: { agent: string; priority: string }) => {
    const mgr = await getManager();
    const task = await mgr.delegate({
      title,
      priority: options.priority as "critical" | "high" | "normal" | "low",
      status: "pending",
      ownerId: options.agent,
      ownerType: "agent",
      source: "cli",
      log: [],
      toolsUsed: [],
      citations: [],
      retryCount: 0,
      estimateMs: 1000,
    });
    console.log(`Task created: ${task.id}`);
  });

taskCommand
  .command("cancel")
  .description("Zruš úkol")
  .argument("<id>", "ID úkolu")
  .action(async (id: string) => {
    const mgr = await getManager();
    await mgr.cancelTask(id);
    console.log(`Task ${id} cancelled`);
  });

program
  .command("export")
  .description("Exportuj všechna data MiLO v otevřeném formátu")
  .option("-f, --format <format>", "Výstupní formát (json, markdown)", "json")
  .option("-o, --output <path>", "Cesta k výstupnímu souboru")
  .option("-t, --type <type>", "Co exportovat (all, agents, missions, knowledge)", "all")
  .action(async (options: { format: string; output?: string; type: string }) => {
    const format = options.format === "markdown" ? "markdown" : "json";
    const type = ["all", "agents", "missions", "knowledge"].includes(options.type) ? options.type : "all";
    const mgr = await getManager();

    let result: string;
    let filename: string;

    const exportData = {
      exportDate: new Date().toISOString(),
      miLOVersion: "0.1.0",
      schemaVersion: "1.0",
    };

    if (type === "agents" || type === "all") {
      const agents = mgr.listAgents();
      const agentsData = await Promise.all(
        agents.map(async (entity) => ({
          id: entity.id,
          agent: entity.agent,
          state: entity.getState(),
          logs: await mgr.getLogs(entity.id),
          memory: await mgr.getMemory(entity.id),
          metrics: await mgr.getMetrics(entity.id),
          taskHistory: entity.getTaskHistory(),
          pendingQueue: entity.getPendingQueue(),
        })),
      );

      if (type === "agents") {
        result = format === "json"
          ? JSON.stringify({ ...exportData, agents: agentsData }, null, 2)
          : agentsToMarkdown(exportData, agentsData);
        filename = `milo-agents-export.${format === "json" ? "json" : "md"}`;
      } else {
        const missions = await mgr.getMissions();
        const tasks = await mgr.getTasks();
        const events = await mgr.getEvents();
        const bundle = { ...exportData, agents: agentsData, missions, tasks, events };
        result = format === "json"
          ? JSON.stringify(bundle, null, 2)
          : fullBundleToMarkdown(bundle);
        filename = `milo-full-export.${format === "json" ? "json" : "md"}`;
      }
    } else if (type === "missions") {
      const missions = await mgr.getMissions();
      result = format === "json"
        ? JSON.stringify({ ...exportData, missions }, null, 2)
        : missionsToMarkdown(exportData, missions);
      filename = `milo-missions-export.${format === "json" ? "json" : "md"}`;
    } else if (type === "knowledge") {
      result = format === "json"
        ? JSON.stringify({ ...exportData, knowledge: {} }, null, 2)
        : `# Export znalostí MiLO\n\n**Exportováno:** ${exportData.exportDate}\n\nKnowledge export is only available via the API server with Obsidian configured.\n`;
      filename = `milo-knowledge-export.${format === "json" ? "json" : "md"}`;
    } else {
      result = "{}";
      filename = "milo-export.json";
    }

    if (options.output) {
      writeFileSync(resolve(options.output), result, "utf-8");
      console.log(`Export uložen do: ${resolve(options.output)}`);
    } else {
      console.log(result);
    }
  });

program.parse();
