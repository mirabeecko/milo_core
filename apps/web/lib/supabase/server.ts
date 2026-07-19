import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // read-only cookie store (e.g. in middleware), ignore
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // read-only cookie store, ignore
        }
      },
    },
  });
}
