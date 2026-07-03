import type { AgentEvent } from "@milo/shared";

export interface AgentEventRepository {
  findAll(options?: { limit?: number; type?: AgentEvent["type"] }): Promise<AgentEvent[]>;
  findByAgentId(agentId: string, options?: { limit?: number; type?: AgentEvent["type"] }): Promise<AgentEvent[]>;
  create(event: Omit<AgentEvent, "id">): Promise<AgentEvent>;
  deleteByAgentId(agentId: string): Promise<void>;
}

export class InMemoryAgentEventRepository implements AgentEventRepository {
  private events = new Map<string, AgentEvent>();
  private counter = 0;

  async findAll(options?: { limit?: number; type?: AgentEvent["type"] }): Promise<AgentEvent[]> {
    let items = Array.from(this.events.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    if (options?.type) {
      items = items.filter((event) => event.type === options.type);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  async findByAgentId(
    agentId: string,
    options?: { limit?: number; type?: AgentEvent["type"] },
  ): Promise<AgentEvent[]> {
    let items = Array.from(this.events.values())
      .filter((event) => event.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (options?.type) {
      items = items.filter((event) => event.type === options.type);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  async create(event: Omit<AgentEvent, "id">): Promise<AgentEvent> {
    this.counter += 1;
    const full: AgentEvent = { ...event, id: `agent-event-${this.counter}` };
    this.events.set(full.id, full);
    return full;
  }

  async deleteByAgentId(agentId: string): Promise<void> {
    for (const [id, event] of this.events) {
      if (event.agentId === agentId) {
        this.events.delete(id);
      }
    }
  }
}
