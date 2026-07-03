import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export function createSupabaseClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
