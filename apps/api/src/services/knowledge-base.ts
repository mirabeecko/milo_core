import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EmbeddingProvider, VectorStore } from "@milo/ai";
import { chunkText } from "./chunking.js";
import { ObsidianIndexer } from "@milo/tools";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DocumentMetadata {
  docId: string;
  title: string;
  source: string;
  path: string;
  chunkIndex: number;
  heading?: string;
  tags?: string[];
  modifiedAt?: string;
  indexedAt: string;
}

export interface SearchFilter {
  source?: string;
  tags?: string[];
  modifiedAfter?: string;
}

export interface SearchResult {
  docId: string;
  title: string;
  chunk: string;
  score: number;
  source: string;
  path: string;
  tags: string[];
  heading?: string;
}

export interface IndexResult {
  documents: number;
  chunks: number;
  skipped: number;
  errors: string[];
}

export interface KnowledgeStats {
  indexedAt: string;
  documents: number;
  chunks: number;
  vectors: number;
  provider: string;
}

interface KnowledgeIndex {
  indexedAt: string;
  documents: Map<string, DocumentMetadata[]>;
  stats: { documents: number; chunks: number };
}

const INDEX_FILE = path.resolve(__dirname, "../../data/knowledge-index.json");

export class KnowledgeBase {
  private embeddingCache = new Map<string, number[]>();
  private index: KnowledgeIndex = {
    indexedAt: "",
    documents: new Map(),
    stats: { documents: 0, chunks: 0 },
  };
  private loaded = false;

  constructor(
    private embeddingProvider: EmbeddingProvider | null,
    private vectorStore: VectorStore<DocumentMetadata>,
  ) {}

  async initialize(): Promise<void> {
    if (this.loaded) return;
    await this.loadIndex();
    this.loaded = true;
  }

  async indexDocument(
    docId: string,
    content: string,
    metadata: Omit<DocumentMetadata, "docId" | "chunkIndex" | "indexedAt">,
  ): Promise<IndexResult> {
    const chunks = chunkText(content);
    const results: IndexResult = { documents: 1, chunks: 0, skipped: 0, errors: [] };

    const chunkMetas: DocumentMetadata[] = [];

    for (const chunk of chunks) {
      chunkMetas.push({
        docId,
        title: metadata.title,
        source: metadata.source,
        path: metadata.path,
        chunkIndex: chunk.index,
        heading: chunk.heading,
        tags: metadata.tags,
        modifiedAt: metadata.modifiedAt,
        indexedAt: new Date().toISOString(),
      });

      results.chunks++;
    }

    if (!this.embeddingProvider) {
      this.index.documents.set(docId, chunkMetas);
      this.index.stats.documents++;
      this.index.stats.chunks += results.chunks;
      await this.persistIndex();
      return results;
    }

    try {
      const chunkTexts = chunks.map((c) => c.text);
      const cachedEmbeds: number[] = [];

      for (const text of chunkTexts) {
        const cached = this.embeddingCache.get(text);
        if (cached) {
          cachedEmbeds.push(...cached);
        } else {
          const embeddings = await this.embeddingProvider.embed([text]);
          for (let i = 0; i < embeddings.length; i++) {
            this.embeddingCache.set(text, embeddings[i]);
            cachedEmbeds.push(...embeddings[i]);
          }
        }
      }

      const allEmbeddings: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedDim = cachedEmbeds.length / chunks.length;
        const embedding = cachedEmbeds.slice(i * embedDim, (i + 1) * embedDim);
        allEmbeddings.push(embedding);
      }

      await this.vectorStore.add(chunkMetas, allEmbeddings);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.errors.push(`Embedding failed for ${docId}: ${message}`);
    }

    this.index.documents.set(docId, chunkMetas);
    this.index.stats.documents++;
    this.index.stats.chunks += results.chunks;

    this.cleanupOldChunks(docId, chunkMetas);

    await this.persistIndex();
    return results;
  }

  async indexDirectory(dirPath: string): Promise<IndexResult> {
    const result: IndexResult = { documents: 0, chunks: 0, skipped: 0, errors: [] };

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const subResult = await this.indexDirectory(fullPath);
          result.documents += subResult.documents;
          result.chunks += subResult.chunks;
          result.skipped += subResult.skipped;
          result.errors.push(...subResult.errors);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const stat = await fs.stat(fullPath);
            const docId = Buffer.from(path.relative(dirPath, fullPath)).toString("base64url");

            const tags = content.match(/#[\w/-]+/g) ?? [];

            const meta = await this.indexDocument(docId, content, {
              title: entry.name.replace(".md", ""),
              source: "filesystem",
              path: fullPath,
              tags: [...new Set(tags)],
              modifiedAt: stat.mtime.toISOString(),
            });

            result.documents += meta.documents;
            result.chunks += meta.chunks;
            result.errors.push(...meta.errors);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            result.errors.push(`Chyba indexace ${fullPath}: ${message}`);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`Chyba čtení adresáře ${dirPath}: ${message}`);
    }

    return result;
  }

  async search(
    query: string,
    topK = 10,
    filters?: SearchFilter,
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const seen = new Set<string>();

    if (this.embeddingProvider) {
      try {
        const queryEmbedding = await this.embeddingProvider.embedQuery(query);
        const filterMeta: Partial<DocumentMetadata> = {};

        if (filters?.source) filterMeta.source = filters.source;

        const vectorResults = await this.vectorStore.search(queryEmbedding, topK, filterMeta);

        for (const r of vectorResults) {
          const key = `${r.item.docId}_${r.item.chunkIndex}`;
          if (seen.has(key)) continue;
          seen.add(key);

          allResults.push({
            docId: r.item.docId,
            title: r.item.title,
            chunk: "",
            score: r.score,
            source: r.item.source,
            path: r.item.path,
            tags: r.item.tags ?? [],
            heading: r.item.heading,
          });
        }
      } catch (err) {
        console.warn("Vector search failed, falling back to keyword:", err);
      }
    }

    const queryLower = query.toLowerCase();
    for (const [, chunkMetas] of this.index.documents) {
      for (const meta of chunkMetas) {
        const key = `${meta.docId}_${meta.chunkIndex}`;
        if (seen.has(key)) continue;

        if (filters?.source && meta.source !== filters.source) continue;
        if (filters?.modifiedAfter && meta.modifiedAt && meta.modifiedAt < filters.modifiedAfter) continue;

        let score = 0;
        if (meta.title?.toLowerCase().includes(queryLower)) score += 10;
        if (meta.heading?.toLowerCase().includes(queryLower)) score += 5;
        if (meta.tags?.some((t) => t.toLowerCase().includes(queryLower))) score += 8;

        if (score > 0) {
          seen.add(key);
          allResults.push({
            docId: meta.docId,
            title: meta.title,
            chunk: "",
            score,
            source: meta.source,
            path: meta.path,
            tags: meta.tags ?? [],
            heading: meta.heading,
          });
        }
      }
    }

    return allResults.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async reindex(): Promise<IndexResult> {
    const result: IndexResult = { documents: 0, chunks: 0, skipped: 0, errors: [] };

    if (this.vectorStore instanceof Object && "clear" in this.vectorStore) {
      await (this.vectorStore as unknown as { clear(): Promise<void> }).clear();
    }

    this.embeddingCache.clear();
    this.index.documents.clear();
    this.index.stats = { documents: 0, chunks: 0 };

    await this.persistIndex();

    return result;
  }

  async getStats(): Promise<KnowledgeStats> {
    const vectorSize = this.vectorStore instanceof Object && "size" in this.vectorStore
      ? await (this.vectorStore as unknown as { size(): Promise<number> }).size()
      : 0;

    return {
      indexedAt: this.index.indexedAt || new Date().toISOString(),
      documents: this.index.stats.documents,
      chunks: this.index.stats.chunks,
      vectors: vectorSize,
      provider: this.embeddingProvider?.name ?? "keyword-only",
    };
  }

  async indexObsidianVault(vaultPath: string): Promise<IndexResult> {
    const indexer = new ObsidianIndexer(vaultPath);
    await indexer.buildIndex();
    const notes = indexer.getNotes();

    const result: IndexResult = { documents: 0, chunks: 0, skipped: 0, errors: [] };

    for (const note of notes) {
      try {
        const docResult = await this.indexDocument(note.id, note.content, {
          title: note.title,
          source: "obsidian",
          path: note.path,
          tags: note.tags,
          modifiedAt: note.modifiedAt instanceof Date
            ? note.modifiedAt.toISOString()
            : String(note.modifiedAt),
        });

        result.documents += docResult.documents;
        result.chunks += docResult.chunks;
        result.errors.push(...docResult.errors);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push(`Chyba indexace ${note.title}: ${message}`);
      }
    }

    this.index.indexedAt = new Date().toISOString();
    await this.persistIndex();
    return result;
  }

  private cleanupOldChunks(docId: string, newMetas: DocumentMetadata[]): void {
    const oldMetas = this.index.documents.get(docId);
    if (oldMetas) {
      for (const meta of oldMetas) {
        (this.vectorStore as unknown as { delete(id: string): Promise<void> })
          ?.delete?.(`${docId}_${meta.chunkIndex}`)
          .catch(() => {});
      }
    }
  }

  private async persistIndex(): Promise<void> {
    const serializable = {
      indexedAt: this.index.indexedAt,
      documents: Object.fromEntries(
        Array.from(this.index.documents.entries()),
      ),
      stats: this.index.stats,
    };

    try {
      await fs.mkdir(path.dirname(INDEX_FILE), { recursive: true });
      await fs.writeFile(INDEX_FILE, JSON.stringify(serializable, null, 2), "utf-8");
    } catch {
      // non-critical
    }
  }

  private async loadIndex(): Promise<void> {
    try {
      const raw = await fs.readFile(INDEX_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      this.index.indexedAt = parsed.indexedAt ?? "";
      this.index.documents = new Map(Object.entries(parsed.documents ?? {}));
      this.index.stats = parsed.stats ?? { documents: 0, chunks: 0 };
    } catch {
      // start with empty index
    }
  }
}
