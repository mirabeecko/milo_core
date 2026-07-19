import path from "node:path";
import { fileURLToPath } from "node:url";
import { ObsidianIndexer, ObsidianNote } from "@milo/tools";
import type { EmbeddingProvider, VectorStore } from "@milo/ai";
import { config } from "../../config/index.js";
import { getObsidianVaultPath } from "../../config/settings.js";
import { loadSettings } from "../../config/settings.js";
import { KnowledgeBase, DocumentMetadata, SearchFilter, SearchResult as KBSearchResult, KnowledgeStats, IndexResult } from "../../services/knowledge-base.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.resolve(__dirname, "../../../data/obsidian-index.json");

export interface ObsidianStatus {
  configured: boolean;
  demo: boolean;
  vaultPath?: string;
  noteCount: number;
  indexedAt?: string;
}

export { type SearchResult, type SearchFilter, type KnowledgeStats, type IndexResult } from "../../services/knowledge-base.js";

let knowledgeBase: KnowledgeBase | null = null;
let embeddingProvider: EmbeddingProvider | null = null;

async function getEmbeddingProvider(): Promise<EmbeddingProvider | null> {
  if (embeddingProvider !== undefined && embeddingProvider !== null) return embeddingProvider;
  if (embeddingProvider === null) return null;

  const settings = await loadSettings();

  if (config.OPENAI_API_KEY) {
    const { OpenAiEmbeddings } = await import("@milo/ai");
    embeddingProvider = new OpenAiEmbeddings(config.OPENAI_API_KEY);
    return embeddingProvider;
  }

  try {
    const { OllamaEmbeddings } = await import("@milo/ai");
    embeddingProvider = new OllamaEmbeddings();
    const test = await embeddingProvider.embedQuery("test");
    if (!test || test.length === 0) {
      embeddingProvider = null;
    }
    return embeddingProvider;
  } catch {
    embeddingProvider = null;
    return null;
  }
}

async function getKnowledgeBase(): Promise<KnowledgeBase | null> {
  if (knowledgeBase) return knowledgeBase;

  const provider = await getEmbeddingProvider();

  const { InMemoryVectorStore } = await import("@milo/ai");
  const vectorStore = new InMemoryVectorStore<DocumentMetadata>();

  knowledgeBase = new KnowledgeBase(provider, vectorStore);
  await knowledgeBase.initialize();
  return knowledgeBase;
}

export class KnowledgeService {
  private indexer: ObsidianIndexer | null = null;
  private currentVaultPath: string | undefined;

  async getVaultPath(): Promise<string | undefined> {
    return config.OBSIDIAN_VAULT_PATH ?? (await getObsidianVaultPath());
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.getVaultPath());
  }

  async isDemo(): Promise<boolean> {
    return !(await this.isConfigured());
  }

  async getStatus(): Promise<ObsidianStatus> {
    const vaultPath = await this.getVaultPath();
    const indexer = await this.ensureIndexer();
    const index = indexer?.getIndex();

    return {
      configured: Boolean(vaultPath),
      demo: await this.isDemo(),
      vaultPath,
      noteCount: indexer?.getNotes().length ?? 0,
      indexedAt: index?.indexedAt,
    };
  }

  async listObsidianNotes(maxResults = 20, query?: string): Promise<ObsidianNote[]> {
    if (await this.isDemo()) {
      return [];
    }

    const indexer = await this.ensureIndexer();
    if (!indexer) {
      return [];
    }

    const notes = query ? indexer.search(query) : indexer.getNotes();
    return notes.slice(0, maxResults);
  }

  async searchObsidian(query: string): Promise<ObsidianNote[]> {
    if (await this.isDemo()) {
      return [];
    }

    const indexer = await this.ensureIndexer();
    if (!indexer) {
      return [];
    }

    return indexer.search(query);
  }

  async getObsidianNote(id: string): Promise<ObsidianNote | null> {
    if (await this.isDemo()) {
      return null;
    }

    const indexer = await this.ensureIndexer();
    if (!indexer) {
      return null;
    }

    return indexer.getNoteById(id) ?? null;
  }

  async reindex(): Promise<ObsidianNote[]> {
    const vaultPath = await this.getVaultPath();
    if (!vaultPath) {
      throw new Error("Obsidian vault path is not configured");
    }

    this.indexer = new ObsidianIndexer(vaultPath);
    this.currentVaultPath = vaultPath;
    await this.indexer.buildIndex();
    await this.indexer.persistIndex(INDEX_FILE);
    return this.indexer.getNotes();
  }

  async hybridSearch(query: string, topK = 10, filters?: SearchFilter): Promise<KBSearchResult[]> {
    const kb = await getKnowledgeBase();
    if (!kb) {
      const obsidianNotes = await this.searchObsidian(query);
      return obsidianNotes.map((note) => ({
        docId: note.id,
        title: note.title,
        chunk: note.content.slice(0, 300),
        score: 1,
        source: "obsidian",
        path: note.path,
        tags: note.tags,
      }));
    }

    return kb.search(query, topK, filters);
  }

  async indexDirectory(dirPath: string): Promise<IndexResult> {
    const kb = await getKnowledgeBase();
    if (!kb) {
      return { documents: 0, chunks: 0, skipped: 0, errors: ["Embedding provider není nakonfigurován"] };
    }

    return kb.indexDirectory(dirPath);
  }

  async indexDocument(docId: string, content: string, metadata: Omit<DocumentMetadata, "docId" | "chunkIndex" | "indexedAt">): Promise<IndexResult> {
    const kb = await getKnowledgeBase();
    if (!kb) {
      return { documents: 0, chunks: 0, skipped: 0, errors: ["Embedding provider není nakonfigurován"] };
    }

    return kb.indexDocument(docId, content, metadata);
  }

  async rebuildIndex(): Promise<IndexResult> {
    const kb = await getKnowledgeBase();
    if (!kb) {
      return { documents: 0, chunks: 0, skipped: 0, errors: ["Embedding provider není nakonfigurován"] };
    }

    const vaultPath = await this.getVaultPath();
    if (vaultPath) {
      return kb.indexObsidianVault(vaultPath);
    }

    return kb.reindex();
  }

  async getKnowledgeStats(): Promise<KnowledgeStats> {
    const kb = await getKnowledgeBase();
    if (!kb) {
      return {
        indexedAt: new Date().toISOString(),
        documents: 0,
        chunks: 0,
        vectors: 0,
        provider: "keyword-only",
      };
    }

    return kb.getStats();
  }

  private async ensureIndexer(): Promise<ObsidianIndexer | null> {
    const vaultPath = await this.getVaultPath();
    if (!vaultPath) {
      return null;
    }

    if (!this.indexer || this.currentVaultPath !== vaultPath) {
      this.indexer = new ObsidianIndexer(vaultPath);
      this.currentVaultPath = vaultPath;
      const loaded = await this.indexer.loadIndex(INDEX_FILE);
      if (!loaded) {
        await this.indexer.buildIndex();
        await this.indexer.persistIndex(INDEX_FILE);
      }
    }

    return this.indexer;
  }
}
