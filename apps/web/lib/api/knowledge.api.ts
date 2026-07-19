import { apiClient } from "./client";
import type { ObsidianNote, ObsidianStatus, KnowledgeStats, SearchFilter } from "@/lib/types";

export interface ObsidianListResponse {
  notes: ObsidianNote[];
}

export interface ObsidianSearchResponse {
  notes: ObsidianNote[];
  query: string;
}

export interface HybridSearchResult {
  docId: string;
  title: string;
  chunk: string;
  score: number;
  source: string;
  path: string;
  tags: string[];
  heading?: string;
}

export interface HybridSearchResponse {
  results: HybridSearchResult[];
  query: string;
}

export interface IndexResponse {
  message: string;
  documents: number;
  chunks: number;
  skipped: number;
  errors: string[];
}

export async function getObsidianNotes(query?: string, maxResults = 50): Promise<ObsidianNote[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("maxResults", String(maxResults));
  try {
    const response = await apiClient<ObsidianListResponse>(`/knowledge/obsidian?${params.toString()}`);
    return response.notes;
  } catch {
    return [];
  }
}

export async function searchObsidian(query: string): Promise<ObsidianNote[]> {
  try {
    const response = await apiClient<ObsidianSearchResponse>(
      `/knowledge/search?q=${encodeURIComponent(query)}`,
    );
    return response.notes;
  } catch {
    return [];
  }
}

export async function hybridSearch(
  query: string,
  topK = 10,
  filters?: SearchFilter,
): Promise<HybridSearchResult[]> {
  try {
    const response = await apiClient<HybridSearchResponse>("/knowledge/search", {
      method: "POST",
      body: JSON.stringify({ query, topK, filters }),
    });
    return response.results;
  } catch {
    return [];
  }
}

export async function getObsidianNote(id: string): Promise<ObsidianNote | null> {
  try {
    const response = await apiClient<{ note: ObsidianNote }>(`/knowledge/obsidian/${id}`);
    return response.note;
  } catch {
    return null;
  }
}

export async function reindexObsidian(): Promise<{ indexed: number }> {
  try {
    return apiClient<{ indexed: number }>("/knowledge/index", { method: "POST" });
  } catch {
    return { indexed: 0 };
  }
}

export async function indexDirectory(path: string): Promise<IndexResponse> {
  return apiClient<IndexResponse>("/knowledge/index/directory", {
    method: "POST",
    body: JSON.stringify({ path }),
  });
}

export async function rebuildKnowledgeIndex(): Promise<IndexResponse> {
  return apiClient<IndexResponse>("/knowledge/reindex", { method: "POST" });
}

export async function getKnowledgeStats(): Promise<KnowledgeStats> {
  try {
    return apiClient<KnowledgeStats>("/knowledge/stats");
  } catch {
    return {
      indexedAt: new Date().toISOString(),
      documents: 0,
      chunks: 0,
      vectors: 0,
      provider: "keyword-only",
    };
  }
}

export async function getObsidianStatus(): Promise<ObsidianStatus> {
  try {
    return apiClient<ObsidianStatus>("/knowledge/settings/obsidian");
  } catch {
    return {
      configured: false,
      demo: false,
      noteCount: 0,
      message: "Obsidian API není dostupné",
    };
  }
}

export async function setObsidianVaultPath(vaultPath: string): Promise<ObsidianStatus> {
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
