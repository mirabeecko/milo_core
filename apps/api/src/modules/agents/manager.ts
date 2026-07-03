import {
  InMemoryAgentEventRepository,
  InMemoryAgentLogRepository,
  InMemoryAgentMemoryRepository,
  InMemoryAgentMetricsRepository,
  InMemoryAgentRepository,
  InMemoryTaskRepository,
} from "@milo/database";
import { AgentManager, registerDefaultAgents } from "@milo/agents";

let manager: AgentManager | null = null;
let startPromise: Promise<void> | null = null;

export async function getAgentManager(): Promise<AgentManager> {
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
  }
  return manager;
}

export async function startAgentManager(): Promise<void> {
  const m = await getAgentManager();
  if (!startPromise) {
    startPromise = m.startAll().then(() => {
      m.startHeartbeat();
    });
  }
  return startPromise;
}

export async function closeAgentManager(): Promise<void> {
  if (manager) {
    await manager.close();
    manager = null;
    startPromise = null;
  }
}
