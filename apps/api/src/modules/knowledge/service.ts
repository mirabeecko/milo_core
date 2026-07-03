import path from "node:path";
import { fileURLToPath } from "node:url";
import { ObsidianIndexer, ObsidianNote } from "@milo/tools";
import { config } from "../../config/index.js";
import { getObsidianVaultPath } from "../../config/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.resolve(__dirname, "../../../data/obsidian-index.json");

export interface ObsidianStatus {
  configured: boolean;
  demo: boolean;
  vaultPath?: string;
  noteCount: number;
  indexedAt?: string;
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
    // Demo se použije pouze pokud není nakonfigurovaný žádný vault.
    // Když uživatel zadá cestu, chce reálná data bez ohledu na DEMO_MODE.
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
      return this.filterDemoNotes(query);
    }

    const indexer = await this.ensureIndexer();
    if (!indexer) {
      return this.filterDemoNotes(query);
    }

    const notes = query ? indexer.search(query) : indexer.getNotes();
    return notes.slice(0, maxResults);
  }

  async searchObsidian(query: string): Promise<ObsidianNote[]> {
    if (await this.isDemo()) {
      return this.filterDemoNotes(query);
    }

    const indexer = await this.ensureIndexer();
    if (!indexer) {
      return this.filterDemoNotes(query);
    }

    return indexer.search(query);
  }

  async getObsidianNote(id: string): Promise<ObsidianNote | null> {
    if (await this.isDemo()) {
      return this.generateDemoNotes().find((note) => note.id === id) ?? null;
    }

    const indexer = await this.ensureIndexer();
    if (!indexer) {
      return this.generateDemoNotes().find((note) => note.id === id) ?? null;
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

  private filterDemoNotes(query?: string): ObsidianNote[] {
    const notes = this.generateDemoNotes();
    if (!query) return notes;

    const lower = query.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lower) ||
        note.content.toLowerCase().includes(lower) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lower)),
    );
  }

  generateDemoNotes(): ObsidianNote[] {
    return [
      {
        id: "demo-obsidian-1",
        title: "Welcome to MiLO",
        path: "welcome.md",
        content: "# Welcome to MiLO\n\nToto je demo poznámka z Obsidianu.\n\n#milo #setup",
        modifiedAt: new Date(),
        tags: ["#milo", "#setup"],
      },
      {
        id: "demo-obsidian-2",
        title: "Daily Notes Template",
        path: "templates/daily.md",
        content: "# {{date}}\n\n## Priority\n- [ ] Hlavní úkol\n\n## Poznámky\n\n#daily",
        modifiedAt: new Date(Date.now() - 86400_000),
        tags: ["#daily"],
      },
    ];
  }
}
