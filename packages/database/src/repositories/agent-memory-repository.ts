import type { AgentMemoryEntry } from "@milo/shared";

export interface AgentMemoryRepository {
  findByAgentId(agentId: string): Promise<AgentMemoryEntry[]>;
  findByKey(agentId: string, key: string): Promise<AgentMemoryEntry | null>;
  upsert(agentId: string, key: string, value: unknown): Promise<AgentMemoryEntry>;
  delete(agentId: string, key: string): Promise<void>;
  deleteByAgentId(agentId: string): Promise<void>;
}

export class InMemoryAgentMemoryRepository implements AgentMemoryRepository {
  private memory = new Map<string, AgentMemoryEntry>();
  private counter = 0;

  private keyFor(agentId: string, key: string): string {
    return `${agentId}:${key}`;
  }

  async findByAgentId(agentId: string): Promise<AgentMemoryEntry[]> {
    return Array.from(this.memory.values())
      .filter((entry) => entry.agentId === agentId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async findByKey(agentId: string, key: string): Promise<AgentMemoryEntry | null> {
    return this.memory.get(this.keyFor(agentId, key)) ?? null;
  }

  async upsert(agentId: string, key: string, value: unknown): Promise<AgentMemoryEntry> {
    const existing = this.memory.get(this.keyFor(agentId, key));
    const now = new Date().toISOString();
    if (existing) {
      const updated: AgentMemoryEntry = { ...existing, value, updatedAt: now };
      this.memory.set(this.keyFor(agentId, key), updated);
      return updated;
    }
    this.counter += 1;
    const full: AgentMemoryEntry = {
      id: `agent-memory-${this.counter}`,
      agentId,
      key,
      value,
      createdAt: now,
      updatedAt: now,
    };
    this.memory.set(this.keyFor(agentId, key), full);
    return full;
  }

  async delete(agentId: string, key: string): Promise<void> {
    this.memory.delete(this.keyFor(agentId, key));
  }

  async deleteByAgentId(agentId: string): Promise<void> {
    for (const [compositeKey, entry] of this.memory) {
      if (entry.agentId === agentId) {
        this.memory.delete(compositeKey);
      }
    }
  }
}
