import { promises as fs } from "node:fs";
import path from "node:path";
import { ObsidianNote, ListNotesOptions } from "./types.js";

export interface ObsidianClientConfig {
  vaultPath: string;
}

export class ObsidianClient {
  private vaultPath: string;

  constructor(config: ObsidianClientConfig) {
    this.vaultPath = config.vaultPath;
  }

  async listNotes(options: ListNotesOptions = {}): Promise<ObsidianNote[]> {
    const maxResults = options.maxResults ?? 50;
    const files = await this.findMarkdownFiles(this.vaultPath);
    const limited = files.slice(0, maxResults);

    const notes: ObsidianNote[] = [];
    for (const filePath of limited) {
      const note = await this.readNote(filePath);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
  }

  async readNote(filePath: string): Promise<ObsidianNote | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const stat = await fs.stat(filePath);
      const relativePath = path.relative(this.vaultPath, filePath);
      const title = path.basename(filePath, ".md");

      return {
        id: Buffer.from(relativePath).toString("base64url"),
        title,
        path: relativePath,
        content,
        modifiedAt: stat.mtime,
        tags: this.extractTags(content),
      };
    } catch {
      return null;
    }
  }

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const nested = await this.findMarkdownFiles(fullPath);
        files.push(...nested);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }

    return files.sort((a, b) => a.localeCompare(b));
  }

  private extractTags(content: string): string[] {
    const matches = content.match(/#[\w/-]+/g);
    return matches ? Array.from(new Set(matches)) : [];
  }
}
