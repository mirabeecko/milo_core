import {
  FileMissionRepository,
  FileTaskRepository,
  InMemoryAgentEventRepository,
  InMemoryAgentLogRepository,
  InMemoryAgentMemoryRepository,
  InMemoryAgentMetricsRepository,
  InMemoryAgentRepository,
} from "@milo/database";
import { AgentManager, registerDefaultAgents } from "@milo/agents";
import { config, TASKS_FILE_PATH } from "../../config/index.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MISSIONS_FILE_PATH = resolve(__dirname, "../../../data/missions.json");

let manager: AgentManager | null = null;
let startPromise: Promise<void> | null = null;

export async function getAgentManager(): Promise<AgentManager> {
  if (!manager) {
    manager = new AgentManager({
      repositories: {
        agents: new InMemoryAgentRepository(),
        tasks: new FileTaskRepository(TASKS_FILE_PATH),
        missions: new FileMissionRepository(MISSIONS_FILE_PATH),
        logs: new InMemoryAgentLogRepository(),
        memory: new InMemoryAgentMemoryRepository(),
        metrics: new InMemoryAgentMetricsRepository(),
        events: new InMemoryAgentEventRepository(),
      },
      vaultPath: config.OBSIDIAN_VAULT_PATH,
      projectPath: "/Users/mb/dev/MiLO_Core",
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
