import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Tool } from "../../types/index.js";

const DEFAULT_MAX_DEPTH = 10;

const readFileSchema = z.object({
  filePath: z.string(),
});

const listFilesSchema = z.object({
  dirPath: z.string(),
  recursive: z.boolean().optional(),
  maxDepth: z.number().int().min(1).max(50).optional().default(DEFAULT_MAX_DEPTH),
});

const statFileSchema = z.object({
  filePath: z.string(),
});

export interface FileContent {
  path: string;
  content: string;
}

export interface FileEntry {
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: Date;
}

export interface FileStat {
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: Date;
}

export class FilesystemTool implements Tool<z.infer<typeof readFileSchema>, FileContent> {
  readonly id = "filesystem:read";
  readonly description = "Read the contents of a file";
  readonly parameters = readFileSchema;

  async execute(input: z.infer<typeof readFileSchema>): Promise<FileContent> {
    const content = await fs.readFile(input.filePath, "utf-8");
    return { path: input.filePath, content };
  }
}

export class FilesystemListTool implements Tool<z.infer<typeof listFilesSchema>, FileEntry[]> {
  readonly id = "filesystem:list";
  readonly description = "List files in a directory";
  readonly parameters = listFilesSchema;

  private async executeRecursive(
    dirPath: string,
    maxDepth: number,
    currentDepth: number,
    visited: Set<string>,
    skipHidden: boolean,
  ): Promise<FileEntry[]> {
    // Depth guard – prevents stack overflow on deep hierarchies
    if (currentDepth > maxDepth) return [];

    // Symlink loop detection – resolve the real path and skip if already visited
    let realPath: string;
    try {
      realPath = await fs.realpath(dirPath);
    } catch {
      // realpath fails on non-existent paths or permission errors; skip the dir
      return [];
    }
    if (visited.has(realPath)) return [];
    visited.add(realPath);

    let entries;
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      // Permission denied or missing directory – skip gracefully
      return [];
    }

    const result: FileEntry[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip hidden entries when skipHidden is true
      if (skipHidden && entry.name.startsWith(".")) continue;

      let stat;
      try {
        stat = await fs.stat(fullPath);
      } catch {
        // File may have been deleted between readdir and stat; skip
        continue;
      }

      result.push({
        path: fullPath,
        isDirectory: stat.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtime,
      });

      if (stat.isDirectory()) {
        const nested = await this.executeRecursive(
          fullPath,
          maxDepth,
          currentDepth + 1,
          visited,
          skipHidden,
        );
        result.push(...nested);
      }
    }

    return result;
  }

  async execute(input: z.infer<typeof listFilesSchema>): Promise<FileEntry[]> {
    const maxDepth = input.maxDepth ?? DEFAULT_MAX_DEPTH;
    const skipHidden = true; // Always skip dot-prefixed dirs/files for safety

    if (input.recursive) {
      return this.executeRecursive(input.dirPath, maxDepth, 0, new Set(), skipHidden);
    }

    // Non-recursive: simple flat listing
    const entries = await fs.readdir(input.dirPath, { withFileTypes: true });
    const result: FileEntry[] = [];

    for (const entry of entries) {
      if (skipHidden && entry.name.startsWith(".")) continue;

      const fullPath = path.join(input.dirPath, entry.name);
      const stat = await fs.stat(fullPath);
      result.push({
        path: fullPath,
        isDirectory: stat.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtime,
      });
    }

    return result;
  }
}

export class FilesystemStatTool implements Tool<z.infer<typeof statFileSchema>, FileStat> {
  readonly id = "filesystem:stat";
  readonly description = "Get metadata about a file or directory";
  readonly parameters = statFileSchema;

  async execute(input: z.infer<typeof statFileSchema>): Promise<FileStat> {
    const stat = await fs.stat(input.filePath);
    return {
      path: input.filePath,
      isDirectory: stat.isDirectory(),
      size: stat.size,
      modifiedAt: stat.mtime,
    };
  }
}

export function registerFilesystemTools(registry: { register(tool: Tool): void }): void {
  registry.register(new FilesystemTool());
  registry.register(new FilesystemListTool());
  registry.register(new FilesystemStatTool());
}
