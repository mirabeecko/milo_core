import type { SupabaseClient } from "@supabase/supabase-js";

export interface FileRecord {
  id: string;
  user_id: string;
  google_file_id: string;
  name: string;
  mime_type?: string;
  size_bytes?: number;
  web_view_link?: string;
  modified_at?: string;
  synced_at: string;
}

export class FilesRepo {
  constructor(private supabase: SupabaseClient) {}

  async upsertBatch(files: Omit<FileRecord, "id" | "synced_at">[]): Promise<number> {
    const withTimestamp = files.map((f) => ({ ...f, synced_at: new Date().toISOString() }));
    const { error, count } = await this.supabase
      .from("drive_files")
      .upsert(withTimestamp, { onConflict: "user_id,google_file_id" });
    if (error) throw error;
    return count ?? 0;
  }

  async findByUserId(userId: string, limit = 50): Promise<FileRecord[]> {
    const { data } = await this.supabase
      .from("drive_files")
      .select("*")
      .eq("user_id", userId)
      .order("modified_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }
}
