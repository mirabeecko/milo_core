/**
 * Supabase Stub — náhrada za @supabase/supabase-js když balíček není dostupný.
 *
 * Vrací mock klienta, který nehází chyby, ale vrací prázdná data.
 * Nahradit reálným Supabase klientem až bude nainstalován.
 */

const noopPromise = Promise.resolve({ data: null, error: null });

function createChainable(): Record<string, () => typeof noopPromise> {
  return new Proxy({} as Record<string, () => typeof noopPromise>, {
    get(_target, _prop) {
      return () => noopPromise;
    },
  });
}

export function createClient(_url: string, _key: string) {
  return {
    auth: {
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error("Supabase nenakonfigurován") }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
      admin: { signOut: () => Promise.resolve({ error: null }) },
    },
    from: (_table: string) => ({
      select: () => createChainable(),
      insert: () => createChainable(),
      upsert: () => createChainable(),
      update: () => createChainable(),
      delete: () => createChainable(),
      eq: () => createChainable(),
      order: () => createChainable(),
      limit: () => createChainable(),
      single: () => Promise.resolve({ data: null, error: null }),
      range: () => createChainable(),
      ilike: () => createChainable(),
    }),
    rpc: (_fn: string) => createChainable(),
  };
}
