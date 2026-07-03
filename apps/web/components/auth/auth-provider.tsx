"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

const ACCESS_TOKEN_KEY = "milo:accessToken";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const demoUser: AuthUser = {
  id: "demo-user",
  email: "demo@milo.local",
  name: "Demo User",
  avatarUrl: null,
};

function storeToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(demoUser);
      setAccessToken("demo-token");
      storeToken("demo-token");
      setIsLoading(false);
      return;
    }

    const supabase = createSupabaseClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      const mappedUser = session ? mapUser(session.user) : null;
      const token = session?.access_token ?? null;
      setUser(mappedUser);
      setAccessToken(token);
      storeToken(token);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const mappedUser = session ? mapUser(session.user) : null;
      const token = session?.access_token ?? null;
      setUser(mappedUser);
      setAccessToken(token);
      storeToken(token);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(demoUser);
      setAccessToken("demo-token");
      storeToken("demo-token");
      return;
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    if (data.user && data.session) {
      setUser(mapUser(data.user));
      setAccessToken(data.session.access_token);
      storeToken(data.session.access_token);
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setAccessToken(null);
      storeToken(null);
      return;
    }

    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    storeToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function mapUser(user: {
  id: string;
  email?: string;
  user_metadata?: { name?: string; avatar_url?: string };
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };
}
