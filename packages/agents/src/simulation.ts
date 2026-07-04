import {
  InMemoryAgentEventRepository,
  InMemoryAgentLogRepository,
  InMemoryAgentMemoryRepository,
  InMemoryAgentMetricsRepository,
  InMemoryAgentRepository,
  InMemoryMissionRepository,
  InMemoryTaskRepository,
} from "@milo/database";
import { AgentManager } from "./agent-manager.js";
import { registerDefaultAgents } from "./registry/index.js";

export async function runMockSimulation(): Promise<void> {
  const manager = new AgentManager({
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

  manager.subscribe(async (event) => {
    const payload = JSON.stringify(event.payload).slice(0, 120);
    console.log(`[${event.type}] ${event.agentId} ${payload}`);
  });

  await registerDefaultAgents(manager);
  await manager.startAll();
  manager.startHeartbeat(5000);

  console.log("\n🚀 Agent Operating System mock simulation started\n");

  // Chief of Staff prepares a briefing
  await manager.delegate({
    title: "Připravit ranní briefing",
    description: "Shrnutí dne, priority a schůzky.",
    type: "report",
    priority: "critical",
    status: "pending",
    ownerId: "chief-of-staff",
    ownerType: "agent",
    source: "simulation",
    log: [],
    toolsUsed: ["calendar", "obsidian"],
    citations: [],
    retryCount: 0,
    estimateMs: 1500,
  });

  // Research Agent searches documents
  await manager.delegate({
    title: "Rešerše ke kauze TJ Krupka",
    description: "Najít relevantní usnesení a smlouvy.",
    type: "search",
    priority: "high",
    status: "pending",
    ownerId: "research",
    ownerType: "agent",
    source: "simulation",
    log: [],
    toolsUsed: ["obsidian", "pdf-parser"],
    citations: [],
    retryCount: 0,
    estimateMs: 2000,
  });

  // Scheduled task: Chief of Staff will run a nightly review in 1 second
  await manager.schedule(
    {
      title: "Noční review",
      description: "Zkontrolovat denní aktivitu a připravit shrnutí.",
      priority: "low",
      status: "pending",
      ownerId: "chief-of-staff",
      ownerType: "agent",
      source: "simulation",
      log: [],
      toolsUsed: ["calendar", "obsidian"],
      citations: [],
      retryCount: 0,
      estimateMs: 800,
    },
    Date.now() + 1000,
  );

  // Task with a missed deadline to test deadline checker
  const missedTask = await manager.delegate({
    title: "Kritický úkol se zpožděným deadlinem",
    description: "Tento úkol měl být hotov už včera.",
    priority: "critical",
    status: "pending",
    ownerId: "chief-of-staff",
    ownerType: "agent",
    source: "simulation",
    log: [],
    toolsUsed: [],
    citations: [],
    retryCount: 0,
    estimateMs: 500,
  });
  manager.getPriorityQueue().enqueue(missedTask, { deadline: Date.now() - 1000 });

  // Wait for tasks to finish
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const agents = manager.listAgents();
  console.log("\n📊 Final agent states:\n");
  for (const entity of agents) {
    const state = entity.getState();
    console.log(
      `• ${entity.agent.name}: ${state.status} | completed: ${state.completedTasks} | failed: ${state.failedTasks}`,
    );
  }

  await manager.close();
  console.log("\n✅ Simulation completed");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMockSimulation().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
