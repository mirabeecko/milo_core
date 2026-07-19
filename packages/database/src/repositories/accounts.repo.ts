import type { SupabaseClient } from "@supabase/supabase-js";

export interface Account {
  id: string;
  user_id: string;
  provider: "google" | "microsoft" | "isds";
  service: "gmail" | "calendar" | "drive" | "isds_inbox";
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export class AccountsRepo {
  constructor(private supabase: SupabaseClient) {}

  async findByUserAndService(userId: string, service: string): Promise<Account | null> {
    const { data } = await this.supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("service", service)
      .single();
    return data;
  }

  async upsert(account: Omit<Account, "id" | "created_at" | "updated_at">): Promise<Account> {
    const { data, error } = await this.supabase
      .from("accounts")
      .upsert(
        { ...account, updated_at: new Date().toISOString() },
        { onConflict: "user_id,provider,service" }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(userId: string, service: string): Promise<void> {
    await this.supabase
      .from("accounts")
      .delete()
      .eq("user_id", userId)
      .eq("service", service);
  }
}
