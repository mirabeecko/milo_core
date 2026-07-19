import { createClient } from "@supabase/supabase-js";
import type { RAGResult, RAGContext } from "./rag.js";
import { calculateRelevance, formatRAGContext, extractSources } from "./rag.js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface SearchOptions {
  userId: string;
  query: string;
  limit?: number;
  sourceTypes?: string[];
}

export async function searchKnowledgeBase(options: SearchOptions): Promise<RAGContext> {
  const { userId, query, limit = 10, sourceTypes } = options;
  const supabase = getSupabase();

  if (!supabase) {
    return { results: [], query, totalFound: 0 };
  }

  let q = supabase
    .from("knowledge_chunks")
    .select("*")
    .eq("user_id", userId)
    .ilike("content", `%${query}%`)
    .limit(limit * 2);

  if (sourceTypes?.length) {
    q = q.in("source_type", sourceTypes);
  }

  const { data: chunks, error } = await q;

  if (error || !chunks?.length) {
    return { results: [], query, totalFound: 0 };
  }

  const scored: RAGResult[] = chunks.map((c) => ({
    chunk: c.content,
    sourceType: c.source_type,
    sourceId: c.source_id,
    score: calculateRelevance(query, c.content),
  }));

  scored.sort((a, b) => b.score - a.score);

  return {
    results: scored.slice(0, limit),
    query,
    totalFound: chunks.length,
  };
}

export async function searchAllSources(options: SearchOptions): Promise<RAGContext> {
  const { userId, query, limit = 10 } = options;
  const supabase = getSupabase();

  if (!supabase) {
    return { results: [], query, totalFound: 0 };
  }

  const results: RAGResult[] = [];

  const { data: emails } = await supabase
    .from("emails")
    .select("id, subject, snippet, body_text")
    .eq("user_id", userId)
    .or(`subject.ilike.%${query}%,snippet.ilike.%${query}%`)
    .limit(limit);

  for (const e of emails ?? []) {
    const content = e.subject ? `${e.subject}: ${e.snippet || ""}` : e.body_text || "";
    results.push({
      chunk: content.slice(0, 800),
      sourceType: "email",
      sourceId: e.id,
      score: calculateRelevance(query, content),
      title: e.subject,
    });
  }

  const { data: notes } = await supabase
    .from("obsidian_notes")
    .select("id, title, content")
    .eq("user_id", userId)
    .ilike("content", `%${query}%`)
    .limit(limit);

  for (const n of notes ?? []) {
    results.push({
      chunk: n.content?.slice(0, 800) || "",
      sourceType: "note",
      sourceId: n.id,
      score: calculateRelevance(query, n.content || ""),
      title: n.title,
      path: n.file_path,
    });
  }

  const { data: files } = await supabase
    .from("drive_files")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", `%${query}%`)
    .limit(limit);

  for (const f of files ?? []) {
    results.push({
      chunk: `File: ${f.name}`,
      sourceType: "drive_file",
      sourceId: f.id,
      score: 1,
      title: f.name,
    });
  }

  results.sort((a, b) => b.score - a.score);

  return {
    results: results.slice(0, limit),
    query,
    totalFound: results.length,
  };
}
