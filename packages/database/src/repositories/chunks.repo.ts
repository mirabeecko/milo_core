import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChunkRecord {
  id: string;
  user_id: string;
  source_type: "email" | "document" | "note" | "drive_file" | "calendar_event";
  source_id: string;
  chunk_index: number;
  content: string;
  token_count?: number;
  created_at: string;
}

export class ChunksRepo {
  constructor(private supabase: SupabaseClient) {}

  async insertBatch(chunks: Omit<ChunkRecord, "id" | "created_at">[]): Promise<number> {
    const { error, count } = await this.supabase.from("knowledge_chunks").insert(chunks);
    if (error) throw error;
    return count ?? 0;
  }

  async search(userId: string, query: string, limit = 10): Promise<ChunkRecord[]> {
    const { data } = await this.supabase
      .from("knowledge_chunks")
      .select("*")
      .eq("user_id", userId)
      .ilike("content", `%${query}%`)
      .limit(limit);
    return data ?? [];
  }

  async findBySource(userId: string, sourceType: string, sourceId: string): Promise<ChunkRecord[]> {
    const { data } = await this.supabase
      .from("knowledge_chunks")
      .select("*")
      .eq("user_id", userId)
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);
    return data ?? [];
  }
}
