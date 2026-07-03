import type { AgentLogEntry } from "@milo/shared";

export interface AgentLogRepository {
  findByAgentId(agentId: string, options?: { limit?: number; level?: AgentLogEntry["level"] }): Promise<AgentLogEntry[]>;
  create(log: Omit<AgentLogEntry, "id">): Promise<AgentLogEntry>;
  deleteByAgentId(agentId: string): Promise<void>;
}

export class InMemoryAgentLogRepository implements AgentLogRepository {
  private logs = new Map<string, AgentLogEntry>();
  private counter = 0;

  async findByAgentId(
    agentId: string,
    options?: { limit?: number; level?: AgentLogEntry["level"] },
  ): Promise<AgentLogEntry[]> {
    let items = Array.from(this.logs.values())
      .filter((log) => log.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.level) {
      items = items.filter((log) => log.level === options.level);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  async create(log: Omit<AgentLogEntry, "id">): Promise<AgentLogEntry> {
    this.counter += 1;
    const full: AgentLogEntry = { ...log, id: `agent-log-${this.counter}` };
    this.logs.set(full.id, full);
    return full;
  }

  async deleteByAgentId(agentId: string): Promise<void> {
    for (const [id, log] of this.logs) {
      if (log.agentId === agentId) {
        this.logs.delete(id);
      }
    }
  }
}
