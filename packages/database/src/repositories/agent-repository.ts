import type { Agent } from "@milo/shared";

export interface AgentRepository {
  findAll(): Promise<Agent[]>;
  findById(id: string): Promise<Agent | null>;
  create(agent: Omit<Agent, "createdAt" | "updatedAt">): Promise<Agent>;
  update(id: string, partial: Partial<Agent>): Promise<Agent>;
  upsert(agent: Agent): Promise<Agent>;
  delete(id: string): Promise<void>;
}

export class InMemoryAgentRepository implements AgentRepository {
  private agents = new Map<string, Agent>();

  async findAll(): Promise<Agent[]> {
    return Array.from(this.agents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findById(id: string): Promise<Agent | null> {
    return this.agents.get(id) ?? null;
  }

  async create(agent: Omit<Agent, "createdAt" | "updatedAt">): Promise<Agent> {
    const now = new Date().toISOString();
    const full: Agent = { ...agent, createdAt: now, updatedAt: now };
    this.agents.set(full.id, full);
    return full;
  }

  async update(id: string, partial: Partial<Agent>): Promise<Agent> {
    const existing = this.agents.get(id);
    if (!existing) {
      throw new Error(`Agent ${id} not found`);
    }
    const updated: Agent = {
      ...existing,
      ...partial,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    this.agents.set(id, updated);
    return updated;
  }

  async upsert(agent: Agent): Promise<Agent> {
    const existing = this.agents.get(agent.id);
    if (existing) {
      return this.update(agent.id, agent);
    }
    this.agents.set(agent.id, agent);
    return agent;
  }

  async delete(id: string): Promise<void> {
    this.agents.delete(id);
  }
}
