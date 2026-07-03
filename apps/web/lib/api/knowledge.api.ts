import { apiClient, useMockData } from "./client";
import type { ObsidianNote, ObsidianStatus } from "@/lib/types";

export interface ObsidianListResponse {
  notes: ObsidianNote[];
  demo?: boolean;
}

export interface ObsidianSearchResponse {
  notes: ObsidianNote[];
  query: string;
}

const demoObsidianNotes: ObsidianNote[] = [
  {
    id: "demo-obsidian-1",
    title: "Welcome to MiLO",
    path: "welcome.md",
    content: "# Welcome to MiLO\n\nToto je demo poznámka z Obsidianu.\n\n#milo #setup",
    modifiedAt: new Date().toISOString(),
    tags: ["#milo", "#setup"],
  },
  {
    id: "demo-obsidian-2",
    title: "Daily Notes Template",
    path: "templates/daily.md",
    content: "# {{date}}\n\n## Priority\n- [ ] Hlavní úkol\n\n## Poznámky\n\n#daily",
    modifiedAt: new Date(Date.now() - 86400_000).toISOString(),
    tags: ["#daily"],
  },
];

export async function getObsidianNotes(query?: string, maxResults = 50): Promise<ObsidianNote[]> {
  if (useMockData) {
    let notes = demoObsidianNotes;
    if (query) {
      const lower = query.toLowerCase();
      notes = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lower) ||
          note.content.toLowerCase().includes(lower) ||
          note.tags.some((tag) => tag.toLowerCase().includes(lower)),
      );
    }
    return notes.slice(0, maxResults);
  }

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("maxResults", String(maxResults));
  const response = await apiClient<ObsidianListResponse>(`/knowledge/obsidian?${params.toString()}`);
  return response.notes;
}

export async function searchObsidian(query: string): Promise<ObsidianNote[]> {
  if (useMockData) {
    const lower = query.toLowerCase();
    return demoObsidianNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(lower) ||
        note.content.toLowerCase().includes(lower) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lower)),
    );
  }

  const response = await apiClient<ObsidianSearchResponse>(
    `/knowledge/search?q=${encodeURIComponent(query)}`,
  );
  return response.notes;
}

export async function getObsidianNote(id: string): Promise<ObsidianNote | null> {
  if (useMockData) {
    return demoObsidianNotes.find((note) => note.id === id) ?? null;
  }

  const response = await apiClient<{ note: ObsidianNote }>(`/knowledge/obsidian/${id}`);
  return response.note;
}

export async function reindexObsidian(): Promise<{ indexed: number }> {
  if (useMockData) {
    return { indexed: demoObsidianNotes.length };
  }

  return apiClient<{ indexed: number }>("/knowledge/index", { method: "POST" });
}

export async function getObsidianStatus(): Promise<ObsidianStatus> {
  if (useMockData) {
    return {
      configured: false,
      demo: true,
      noteCount: demoObsidianNotes.length,
    };
  }

  return apiClient<ObsidianStatus>("/knowledge/settings/obsidian");
}

export async function setObsidianVaultPath(vaultPath: string): Promise<ObsidianStatus> {
  if (useMockData) {
    return {
      configured: true,
      demo: false,
      vaultPath,
      noteCount: demoObsidianNotes.length,
      indexedAt: new Date().toISOString(),
    };
  }

  return apiClient<ObsidianStatus>("/knowledge/settings/obsidian", {
    method: "POST",
    body: JSON.stringify({ vaultPath }),
  });
}

export function mapObsidianToDocument(note: ObsidianNote): {
  id: string;
  title: string;
  type: string;
  source: "obsidian";
  date: string;
  project?: string;
  tags: string[];
  snippet: string;
} {
  return {
    id: note.id,
    title: note.title,
    type: "Poznámka",
    source: "obsidian" as const,
    date: note.modifiedAt,
    project: undefined,
    tags: note.tags,
    snippet: note.content.replace(/#+ /g, "").replace(/\n/g, " ").slice(0, 160).trim(),
  };
}
