import type { SupabaseClient } from "@supabase/supabase-js";

export interface EmailRecord {
  id: string;
  user_id: string;
  gmail_id: string;
  thread_id?: string;
  subject?: string;
  from_address?: string;
  snippet?: string;
  labels?: string[];
  is_read?: boolean;
  is_important?: boolean;
  has_attachments?: boolean;
  received_at?: string;
  synced_at: string;
}

export class EmailsRepo {
  constructor(private supabase: SupabaseClient) {}

  async upsertBatch(emails: Omit<EmailRecord, "id" | "synced_at">[]): Promise<number> {
    const withTimestamp = emails.map((e) => ({ ...e, synced_at: new Date().toISOString() }));
    const { error, count } = await this.supabase
      .from("emails")
      .upsert(withTimestamp, { onConflict: "user_id,gmail_id" });
    if (error) throw error;
    return count ?? 0;
  }

  async findByUserId(userId: string, limit = 50): Promise<EmailRecord[]> {
    const { data } = await this.supabase
      .from("emails")
      .select("*")
      .eq("user_id", userId)
      .order("received_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }

  async search(userId: string, query: string, limit = 20): Promise<EmailRecord[]> {
    const { data } = await this.supabase
      .from("emails")
      .select("*")
      .eq("user_id", userId)
      .or(`subject.ilike.%${query}%,body_text.ilike.%${query}%,snippet.ilike.%${query}%`)
      .limit(limit);
    return data ?? [];
  }
}
