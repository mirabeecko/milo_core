import { promises as fs } from "node:fs";
import path from "node:path";
import { ObsidianClient } from "./index.js";
import { ObsidianNote } from "./types.js";

export interface ObsidianIndex {
  notes: ObsidianNote[];
  indexedAt: string;
  vaultPath: string;
}

export interface SearchResult {
  note: ObsidianNote;
  score: number;
}

export class ObsidianIndexer {
  private client: ObsidianClient;
  private vaultPath: string;
  private index: ObsidianIndex | null = null;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
    this.client = new ObsidianClient({ vaultPath });
  }

  async buildIndex(): Promise<ObsidianIndex> {
    const notes = await this.client.listNotes({ maxResults: Number.MAX_SAFE_INTEGER });
    this.index = {
      notes,
      indexedAt: new Date().toISOString(),
      vaultPath: this.vaultPath,
    };
    return this.index;
  }

  async persistIndex(filePath: string): Promise<void> {
    if (!this.index) {
      await this.buildIndex();
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(this.index, null, 2), "utf-8");
  }

  async loadIndex(filePath: string): Promise<ObsidianIndex | null> {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as ObsidianIndex;
      // serializace Date vrací string, převedeme zpět
      parsed.notes = parsed.notes.map((note) => ({
        ...note,
        modifiedAt: new Date(note.modifiedAt),
      }));
      this.index = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  search(query: string): ObsidianNote[] {
    if (!this.index) {
      return [];
    }

    const lower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const note of this.index.notes) {
      let score = 0;

      if (note.title.toLowerCase().includes(lower)) {
        score += 10;
      }
      if (note.path.toLowerCase().includes(lower)) {
        score += 5;
      }
      if (note.content.toLowerCase().includes(lower)) {
        score += 2;
      }
      if (note.tags.some((tag) => tag.toLowerCase().includes(lower))) {
        score += 8;
      }

      if (score > 0) {
        results.push({ note, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map((result) => result.note);
  }

  getNoteById(id: string): ObsidianNote | undefined {
    return this.index?.notes.find((note) => note.id === id);
  }

  getNotes(): ObsidianNote[] {
    return this.index?.notes ?? [];
  }

  getIndex(): ObsidianIndex | null {
    return this.index;
  }
}
