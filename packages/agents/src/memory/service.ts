import type { AgentMemory, MemoryEntry, MemoryQuery, MemoryScope } from "./types.js";
import type { MemoryStorage } from "./types.js";

const DEFAULT_SHORT_TERM_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_LONG_TERM_IMPORTANCE = 0.5;
const DEFAULT_WORKING_IMPORTANCE = 0.9;
const DEFAULT_EXPERIENCE_IMPORTANCE = 0.8;
const DEFAULT_EPISODE_IMPORTANCE = 0.6;

export class AgentMemoryImpl implements AgentMemory {
  constructor(
    private agentId: string,
    private storage: MemoryStorage,
  ) {}

  async remember(
    scope: "short_term" | "long_term",
    key: string,
    value: unknown,
    ttlMsOrImportance?: number,
  ): Promise<void> {
    const importance =
      scope === "short_term" ? ttlMsOrImportance ?? 0.5 : ttlMsOrImportance ?? DEFAULT_LONG_TERM_IMPORTANCE;
    const expiresAt =
      scope === "short_term"
        ? new Date(Date.now() + (ttlMsOrImportance ?? DEFAULT_SHORT_TERM_TTL_MS)).toISOString()
        : undefined;

    await this.storage.upsert({
      agentId: this.agentId,
      scope,
      key,
      value,
      importance,
      expiresAt,
    });
  }

  async setWorkingContext(key: string, value: unknown): Promise<void> {
    await this.storage.upsert({
      agentId: this.agentId,
      scope: "working",
      key,
      value,
      importance: DEFAULT_WORKING_IMPORTANCE,
    });
  }

  async addExperience(key: string, value: unknown): Promise<void> {
    await this.storage.upsert({
      agentId: this.agentId,
      scope: "experience",
      key,
      value,
      importance: DEFAULT_EXPERIENCE_IMPORTANCE,
    });
  }

  async addEpisode(key: string, value: unknown): Promise<void> {
    await this.storage.upsert({
      agentId: this.agentId,
      scope: "episodic",
      key,
      value,
      importance: DEFAULT_EPISODE_IMPORTANCE,
    });
  }

  async recall(scope: MemoryScope, key: string): Promise<unknown> {
    const entry = await this.storage.findByKey(this.agentId, scope, key);
    if (!entry) return undefined;
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      await this.storage.delete(this.agentId, scope, key);
      return undefined;
    }
    return entry.value;
  }

  async search(scope: MemoryScope, keyPrefix: string, limit?: number): Promise<MemoryEntry[]> {
    return this.storage.findByAgentId(this.agentId, {
      scope,
      keyPrefix,
      limit,
    });
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    return this.storage.findByAgentId(this.agentId, query);
  }

  async getWorkingContext(): Promise<Record<string, unknown>> {
    const entries = await this.storage.findByAgentId(this.agentId, { scope: "working" });
    const context: Record<string, unknown> = {};
    for (const entry of entries) {
      context[entry.key] = entry.value;
    }
    return context;
  }

  async getRecentEpisodes(limit = 10): Promise<MemoryEntry[]> {
    return this.storage.findByAgentId(this.agentId, {
      scope: "episodic",
      limit,
    });
  }

  async getExperiences(limit = 10): Promise<MemoryEntry[]> {
    return this.storage.findByAgentId(this.agentId, {
      scope: "experience",
      limit,
    });
  }

  async forget(scope: MemoryScope, key: string): Promise<void> {
    await this.storage.delete(this.agentId, scope, key);
  }

  async clear(scope: MemoryScope): Promise<void> {
    await this.storage.deleteByAgentId(this.agentId, scope);
  }

  async consolidate(
    scope: "short_term",
    into: "long_term" | "experience",
    minImportance = 0.7,
  ): Promise<void> {
    const entries = await this.storage.findByAgentId(this.agentId, {
      scope,
      minImportance,
    });

    for (const entry of entries) {
        await this.storage.upsert({
        agentId: this.agentId,
        scope: into,
        key: entry.key,
        value: entry.value,
        importance: entry.importance,
      });
      await this.storage.delete(this.agentId, scope, entry.key);
    }
  }
}
