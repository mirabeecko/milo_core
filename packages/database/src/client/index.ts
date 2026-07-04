import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
}

export interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export function createDatabaseClient(config: DatabaseConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type { SupabaseClient };
