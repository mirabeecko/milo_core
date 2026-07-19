import type { SupabaseClient } from "@supabase/supabase-js";

export interface NoteRecord {
  id: string;
  user_id: string;
  file_path: string;
  title?: string;
  content?: string;
  tags?: string[];
  modified_at?: string;
  synced_at: string;
}

export class NotesRepo {
  constructor(private supabase: SupabaseClient) {}

  async upsertBatch(notes: Omit<NoteRecord, "id" | "synced_at">[]): Promise<number> {
    const withTimestamp = notes.map((n) => ({ ...n, synced_at: new Date().toISOString() }));
    const { error, count } = await this.supabase
      .from("obsidian_notes")
      .upsert(withTimestamp, { onConflict: "user_id,file_path" });
    if (error) throw error;
    return count ?? 0;
  }

  async findByUserId(userId: string, limit = 50): Promise<NoteRecord[]> {
    const { data } = await this.supabase
      .from("obsidian_notes")
      .select("*")
      .eq("user_id", userId)
      .order("modified_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }
}
