import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Tool } from "../../types/index.js";

const readFileSchema = z.object({
  filePath: z.string(),
});

const listFilesSchema = z.object({
  dirPath: z.string(),
  recursive: z.boolean().optional(),
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

  async execute(input: z.infer<typeof listFilesSchema>): Promise<FileEntry[]> {
    const entries = await fs.readdir(input.dirPath, { withFileTypes: true });
    const result: FileEntry[] = [];

    for (const entry of entries) {
      const fullPath = path.join(input.dirPath, entry.name);
      const stat = await fs.stat(fullPath);
      result.push({
        path: fullPath,
        isDirectory: stat.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtime,
      });

      if (input.recursive && entry.isDirectory() && !entry.name.startsWith(".")) {
        const nested = await new FilesystemListTool().execute({
          dirPath: fullPath,
          recursive: true,
        });
        result.push(...nested);
      }
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
