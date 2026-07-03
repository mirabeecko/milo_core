"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
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

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(demoUser);
      setIsLoading(false);
      return;
    }

    const supabase = createSupabaseClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? mapUser(session.user) : null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? mapUser(session.user) : null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(demoUser);
      return;
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(null);
      return;
    }

    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>;
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
