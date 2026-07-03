import { z } from "zod";
import type { Tool, ToolContext } from "../../../types/index.js";
import { ObsidianClient } from "../index.js";

const listNotesSchema = z.object({
  maxResults: z.number().optional(),
});

const readNoteSchema = z.object({
  filePath: z.string(),
});

const searchNotesSchema = z.object({
  query: z.string(),
});

export class ObsidianListTool implements Tool<z.infer<typeof listNotesSchema>, unknown> {
  readonly id = "obsidian:list";
  readonly description = "List notes in the Obsidian vault";
  readonly parameters = listNotesSchema;

  async execute(input: z.infer<typeof listNotesSchema>, context: ToolContext): Promise<unknown> {
    const vaultPath = context.vaultPath;
    if (!vaultPath) {
      throw new Error("Vault path not configured");
    }
    const client = new ObsidianClient({ vaultPath });
    return client.listNotes({ maxResults: input.maxResults });
  }
}

export class ObsidianReadTool implements Tool<z.infer<typeof readNoteSchema>, unknown> {
  readonly id = "obsidian:read";
  readonly description = "Read a note from the Obsidian vault";
  readonly parameters = readNoteSchema;

  async execute(input: z.infer<typeof readNoteSchema>, context: ToolContext): Promise<unknown> {
    const vaultPath = context.vaultPath;
    if (!vaultPath) {
      throw new Error("Vault path not configured");
    }
    const client = new ObsidianClient({ vaultPath });
    const note = await client.readNote(input.filePath);
    if (!note) {
      throw new Error(`Note not found: ${input.filePath}`);
    }
    return note;
  }
}

export class ObsidianSearchTool implements Tool<z.infer<typeof searchNotesSchema>, unknown> {
  readonly id = "obsidian:search";
  readonly description = "Search notes in the Obsidian vault by title or content";
  readonly parameters = searchNotesSchema;

  async execute(input: z.infer<typeof searchNotesSchema>, context: ToolContext): Promise<unknown> {
    const vaultPath = context.vaultPath;
    if (!vaultPath) {
      throw new Error("Vault path not configured");
    }
    const client = new ObsidianClient({ vaultPath });
    const notes = await client.listNotes({ maxResults: 1000 });
    const query = input.query.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }
}

export function registerObsidianTools(registry: { register(tool: Tool): void }): void {
  registry.register(new ObsidianListTool());
  registry.register(new ObsidianReadTool());
  registry.register(new ObsidianSearchTool());
}
