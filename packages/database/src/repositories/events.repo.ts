import type { SupabaseClient } from "@supabase/supabase-js";

export interface EventRecord {
  id: string;
  user_id: string;
  google_event_id: string;
  summary?: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  attendees?: string[];
  status?: string;
  calendar_id?: string;
  color?: string;
  synced_at: string;
}

export class EventsRepo {
  constructor(private supabase: SupabaseClient) {}

  async upsertBatch(events: Omit<EventRecord, "id" | "synced_at">[]): Promise<number> {
    const withTimestamp = events.map((e) => ({ ...e, synced_at: new Date().toISOString() }));
    const { error, count } = await this.supabase
      .from("calendar_events")
      .upsert(withTimestamp, { onConflict: "user_id,google_event_id" });
    if (error) throw error;
    return count ?? 0;
  }

  async findByUserId(userId: string, start: string, end: string): Promise<EventRecord[]> {
    const { data } = await this.supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", start)
      .lte("end_time", end)
      .order("start_time", { ascending: true });
    return data ?? [];
  }
}
