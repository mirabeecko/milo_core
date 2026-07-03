#!/usr/bin/env node
import { program } from "commander";
import dotenv from "dotenv";
import {
  InMemoryAgentEventRepository,
  InMemoryAgentLogRepository,
  InMemoryAgentMemoryRepository,
  InMemoryAgentMetricsRepository,
  InMemoryAgentRepository,
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

program.parse();
