import type { AgentMetricsSnapshot } from "@milo/shared";

export interface AgentMetricsRepository {
  findByAgentId(agentId: string, options?: { limit?: number }): Promise<AgentMetricsSnapshot[]>;
  getLatest(agentId: string): Promise<AgentMetricsSnapshot | null>;
  create(snapshot: Omit<AgentMetricsSnapshot, "id">): Promise<AgentMetricsSnapshot>;
  deleteByAgentId(agentId: string): Promise<void>;
}

export class InMemoryAgentMetricsRepository implements AgentMetricsRepository {
  private snapshots = new Map<string, AgentMetricsSnapshot>();
  private counter = 0;

  async findByAgentId(agentId: string, options?: { limit?: number }): Promise<AgentMetricsSnapshot[]> {
    let items = Array.from(this.snapshots.values())
      .filter((snapshot) => snapshot.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  async getLatest(agentId: string): Promise<AgentMetricsSnapshot | null> {
    const items = await this.findByAgentId(agentId, { limit: 1 });
    return items[0] ?? null;
  }

  async create(snapshot: Omit<AgentMetricsSnapshot, "id">): Promise<AgentMetricsSnapshot> {
    this.counter += 1;
    const full: AgentMetricsSnapshot = { ...snapshot, id: `agent-metrics-${this.counter}` };
    this.snapshots.set(full.id, full);
    return full;
  }

  async deleteByAgentId(agentId: string): Promise<void> {
    for (const [id, snapshot] of this.snapshots) {
      if (snapshot.agentId === agentId) {
        this.snapshots.delete(id);
      }
    }
  }
}
