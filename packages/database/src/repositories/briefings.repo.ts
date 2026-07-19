import type { SupabaseClient } from "@supabase/supabase-js";

export interface BriefingRecord {
  id: string;
  user_id: string;
  generated_at: string;
  content: string;
  version?: string;
  summary?: string;
  blocker_count?: number;
  section_count?: number;
}

export class BriefingsRepo {
  constructor(private supabase: SupabaseClient) {}

  async create(briefing: Omit<BriefingRecord, "id">): Promise<BriefingRecord> {
    const { data, error } = await this.supabase.from("briefings").insert(briefing).select().single();
    if (error) throw error;
    return data;
  }

  async getLatest(userId: string): Promise<BriefingRecord | null> {
    const { data } = await this.supabase
      .from("briefings")
      .select("*")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();
    return data;
  }
}
