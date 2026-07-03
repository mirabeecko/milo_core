export type MemoryScope = "short_term" | "long_term" | "working" | "experience" | "episodic";

export interface MemoryEntry<T = unknown> {
  id: string;
  agentId: string;
  scope: MemoryScope;
  key: string;
  value: T;
  importance: number; // 0-1
  expiresAt?: string; // ISO date for short-term memory
  createdAt: string;
  updatedAt: string;
}

export interface MemoryQuery {
  scope?: MemoryScope;
  key?: string;
  keyPrefix?: string;
  minImportance?: number;
  limit?: number;
  before?: string;
  after?: string;
}

export interface MemoryStorage {
  findByAgentId(agentId: string, query?: MemoryQuery): Promise<MemoryEntry[]>;
  findByKey(agentId: string, scope: MemoryScope, key: string): Promise<MemoryEntry | null>;
  upsert(entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">): Promise<MemoryEntry>;
  delete(agentId: string, scope: MemoryScope, key: string): Promise<void>;
  deleteByAgentId(agentId: string, scope?: MemoryScope): Promise<void>;
}

export interface AgentMemory {
  // Short-term: recent context, auto-expires
  remember(scope: "short_term", key: string, value: unknown, ttlMs?: number): Promise<void>;
  // Long-term: persisted facts
  remember(scope: "long_term", key: string, value: unknown, importance?: number): Promise<void>;
  // Working: active task context
  setWorkingContext(key: string, value: unknown): Promise<void>;
  // Experience: lessons from completed tasks
  addExperience(key: string, value: unknown): Promise<void>;
  // Episodic: task history
  addEpisode(key: string, value: unknown): Promise<void>;

  recall(scope: MemoryScope, key: string): Promise<unknown>;
  search(scope: MemoryScope, keyPrefix: string, limit?: number): Promise<MemoryEntry[]>;
  query(query: MemoryQuery): Promise<MemoryEntry[]>;
  getWorkingContext(): Promise<Record<string, unknown>>;
  getRecentEpisodes(limit?: number): Promise<MemoryEntry[]>;
  getExperiences(limit?: number): Promise<MemoryEntry[]>;

  forget(scope: MemoryScope, key: string): Promise<void>;
  clear(scope: MemoryScope): Promise<void>;
  consolidate(scope: "short_term", into: "long_term" | "experience", minImportance?: number): Promise<void>;
}
