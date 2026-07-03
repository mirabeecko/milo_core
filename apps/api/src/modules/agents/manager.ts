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
    await manager.startAll();
    manager.startHeartbeat();
  }
  return manager;
}

export async function closeAgentManager(): Promise<void> {
  if (manager) {
    await manager.close();
    manager = null;
  }
}
