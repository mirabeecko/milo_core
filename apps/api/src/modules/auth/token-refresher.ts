import { createDatabaseClient, type SupabaseClient } from "@milo/database";
import { config } from "../../config/index.js";

function getSupabaseClient(): SupabaseClient | null {
  const url = config.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = config.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createDatabaseClient({ url, serviceRoleKey: key });
}

export async function getRefreshedTokens(
  userId: string,
  service: string,
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("service", service)
    .single();

  if (!account?.refresh_token) return null;

  if (account.token_expires_at && new Date(account.token_expires_at).getTime() > Date.now() + 5 * 60 * 1000) {
    return { accessToken: account.access_token, refreshToken: account.refresh_token };
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;

    const tokens = await response.json();

    await supabase.from("accounts").update({
      access_token: tokens.access_token,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }).eq("id", account.id);

    return { accessToken: tokens.access_token, refreshToken: account.refresh_token };
  } catch {
    return null;
  }
}
