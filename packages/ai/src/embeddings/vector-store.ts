import { VectorStore, VectorSearchResult } from "./index.js";

interface VectorEntry<T> {
  id: string;
  vector: number[];
  metadata: T;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must have the same length: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface InMemoryVectorStoreOptions<T> {
  preFilter?: (metadata: T, filter: Partial<T>) => boolean;
}

export class InMemoryVectorStore<T> implements VectorStore<T> {
  private entries = new Map<string, VectorEntry<T>>();
  private filterFn: (metadata: T, filter: Partial<T>) => boolean;

  constructor(options?: InMemoryVectorStoreOptions<T>) {
    this.filterFn =
      options?.preFilter ??
      ((metadata, filter) => {
        for (const key of Object.keys(filter as Record<string, unknown>)) {
          const filterVal = (filter as Record<string, unknown>)[key];
          const metaVal = (metadata as Record<string, unknown>)[key];

          if (filterVal === undefined || filterVal === null) continue;

          if (typeof filterVal === "string") {
            if (typeof metaVal === "string") {
              if (!metaVal.toLowerCase().includes(filterVal.toLowerCase())) return false;
            } else {
              return false;
            }
          } else if (Array.isArray(filterVal) && Array.isArray(metaVal)) {
            if (!filterVal.some((v) => metaVal.includes(v))) return false;
          } else {
            if (metaVal !== filterVal) return false;
          }
        }
        return true;
      });
  }

  async add(items: T[], embeddings: number[][]): Promise<void> {
    if (items.length !== embeddings.length) {
      throw new Error(`Items (${items.length}) and embeddings (${embeddings.length}) must have the same length`);
    }

    for (let i = 0; i < items.length; i++) {
      const id = `vec_${this.entries.size}_${Date.now()}_${i}`;
      this.entries.set(id, {
        id,
        vector: embeddings[i],
        metadata: items[i],
      });
    }
  }

  async addBatch(entries: { id: string; vector: number[]; metadata: T }[]): Promise<void> {
    for (const entry of entries) {
      this.entries.set(entry.id, { ...entry });
    }
  }

  async search(
    queryEmbedding: number[],
    limit = 10,
    filter?: Partial<T>,
  ): Promise<VectorSearchResult<T>[]> {
    const results: { item: T; score: number }[] = [];

    for (const entry of this.entries.values()) {
      if (filter && !this.filterFn(entry.metadata, filter)) continue;

      const score = cosineSimilarity(queryEmbedding, entry.vector);
      results.push({ item: entry.metadata, score });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  async size(): Promise<number> {
    return this.entries.size;
  }

  getEntries(): Map<string, VectorEntry<T>> {
    return this.entries;
  }
}
