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

export async function getObsidianNotes(query?: string, maxResults = 50): Promise<ObsidianNote[]> {
  if (useMockData) {
    return [];
  }

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("maxResults", String(maxResults));
  const response = await apiClient<ObsidianListResponse>(`/knowledge/obsidian?${params.toString()}`);
  return response.notes;
}

export async function searchObsidian(query: string): Promise<ObsidianNote[]> {
  if (useMockData) {
    return [];
  }

  const response = await apiClient<ObsidianSearchResponse>(
    `/knowledge/search?q=${encodeURIComponent(query)}`,
  );
  return response.notes;
}

export async function getObsidianNote(id: string): Promise<ObsidianNote | null> {
  if (useMockData) {
    return null;
  }

  const response = await apiClient<{ note: ObsidianNote }>(`/knowledge/obsidian/${id}`);
  return response.note;
}

export async function reindexObsidian(): Promise<{ indexed: number }> {
  if (useMockData) {
    return { indexed: 0 };
  }

  return apiClient<{ indexed: number }>("/knowledge/index", { method: "POST" });
}

export async function getObsidianStatus(): Promise<ObsidianStatus> {
  if (useMockData) {
    return {
      configured: false,
      demo: true,
      noteCount: 0,
      message: "Obsidian vault není nakonfigurován",
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
      noteCount: 0,
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
