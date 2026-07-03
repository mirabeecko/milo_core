import type { AgentMemoryRepository } from "@milo/database";
import type { AgentMemoryEntry as DbMemoryEntry } from "@milo/shared";
import type { MemoryEntry, MemoryQuery, MemoryScope, MemoryStorage } from "./types.js";

export class RepositoryMemoryStorage implements MemoryStorage {
  constructor(private repository: AgentMemoryRepository) {}

  async findByAgentId(agentId: string, query?: MemoryQuery): Promise<MemoryEntry[]> {
    const entries = await this.repository.findByAgentId(agentId);
    return this.filter(entries.map(this.toMemoryEntry), query);
  }

  async findByKey(agentId: string, scope: MemoryScope, key: string): Promise<MemoryEntry | null> {
    const dbKey = this.dbKey(scope, key);
    const entry = await this.repository.findByKey(agentId, dbKey);
    return entry ? this.toMemoryEntry(entry) : null;
  }

  async upsert(entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">): Promise<MemoryEntry> {
    const dbKey = this.dbKey(entry.scope, entry.key);
    const value = {
      scope: entry.scope,
      key: entry.key,
      value: entry.value,
      importance: entry.importance,
      expiresAt: entry.expiresAt,
    };
    const saved = await this.repository.upsert(entry.agentId, dbKey, value);
    return this.toMemoryEntry(saved);
  }

  async delete(agentId: string, scope: MemoryScope, key: string): Promise<void> {
    await this.repository.delete(agentId, this.dbKey(scope, key));
  }

  async deleteByAgentId(agentId: string, scope?: MemoryScope): Promise<void> {
    if (!scope) {
      await this.repository.deleteByAgentId(agentId);
      return;
    }
    const entries = await this.findByAgentId(agentId, { scope });
    await Promise.all(entries.map((e) => this.delete(agentId, e.scope, e.key)));
  }

  private dbKey(scope: MemoryScope, key: string): string {
    return `${scope}:${key}`;
  }

  private toMemoryEntry(entry: DbMemoryEntry): MemoryEntry {
    const value = entry.value as {
      scope: MemoryScope;
      key: string;
      value: unknown;
      importance: number;
      expiresAt?: string;
    };
    return {
      id: entry.id,
      agentId: entry.agentId,
      scope: value.scope,
      key: value.key,
      value: value.value,
      importance: value.importance ?? 0.5,
      expiresAt: value.expiresAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private filter(entries: MemoryEntry[], query?: MemoryQuery): MemoryEntry[] {
    if (!query) return entries;

    let result = entries;

    if (query.scope) {
      result = result.filter((e) => e.scope === query.scope);
    }
    if (query.key) {
      result = result.filter((e) => e.key === query.key);
    }
    if (query.keyPrefix) {
      result = result.filter((e) => e.key.startsWith(query.keyPrefix ?? ""));
    }
    if (query.minImportance !== undefined) {
      result = result.filter((e) => e.importance >= (query.minImportance ?? 0));
    }
    if (query.before) {
      result = result.filter((e) => e.updatedAt <= query.before!);
    }
    if (query.after) {
      result = result.filter((e) => e.updatedAt >= query.after!);
    }

    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (query.limit) {
      result = result.slice(0, query.limit);
    }

    return result;
  }
}
