import { createDatabaseClient, type SupabaseClient } from "@milo/database";
import { config } from "../../config/index.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthMode {
  mode: "demo" | "supabase";
  configured: boolean;
}

const DEMO_USER: AuthUser = {
  id: "demo-user",
  email: "demo@milo.local",
  name: "Demo User",
  avatarUrl: null,
};

export class AuthService {
  private supabase: SupabaseClient | null = null;
  private isDemo: boolean;

  constructor() {
    if (config.DEMO_MODE || !config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      this.isDemo = true;
      return;
    }

    this.isDemo = false;
    this.supabase = createDatabaseClient({
      url: config.SUPABASE_URL,
      serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
    });
  }

  async signInWithPassword(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    if (this.isDemo) {
      return {
        user: DEMO_USER,
        tokens: {
          accessToken: "demo-token",
          refreshToken: "demo-refresh-token",
          expiresAt: 0,
        },
      };
    }

    if (!this.supabase) {
      throw new Error("Authentication failed");
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      throw new Error(error?.message ?? "Authentication failed");
    }

    return {
      user: this.mapUser(data.user),
      tokens: this.mapSession(data.session),
    };
  }

  async getUser(accessToken: string): Promise<AuthUser | null> {
    if (this.isDemo && accessToken === "demo-token") {
      return DEMO_USER;
    }

    if (!this.supabase) {
      return null;
    }

    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return this.mapUser(data.user);
  }

  async getUserWithExpiry(accessToken: string): Promise<{ user: AuthUser; expired: boolean } | null> {
    if (this.isDemo && accessToken === "demo-token") {
      return { user: DEMO_USER, expired: false };
    }

    if (!this.supabase) {
      return null;
    }

    const payload = decodeJwtPayload(accessToken);
    const isExpired = payload ? (payload.exp ?? 0) * 1000 < Date.now() : false;

    if (isExpired) {
      return null;
    }

    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return { user: this.mapUser(data.user), expired: false };
  }

  isTokenExpired(accessToken: string): boolean {
    if (this.isDemo) return false;
    const payload = decodeJwtPayload(accessToken);
    if (!payload?.exp) return false;
    return payload.exp * 1000 < Date.now();
  }

  getAuthMode(): AuthMode {
    if (this.isDemo) {
      return {
        mode: "demo",
        configured: Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY),
      };
    }

    return {
      mode: "supabase",
      configured: true,
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthTokens> {
    if (this.isDemo) {
      return {
        accessToken: "demo-token",
        refreshToken: "demo-refresh-token",
        expiresAt: 0,
      };
    }

    if (!this.supabase) {
      throw new Error("Session refresh failed");
    }

    const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new Error(error?.message ?? "Session refresh failed");
    }

    return this.mapSession(data.session);
  }

  async signOut(accessToken: string): Promise<void> {
    if (this.isDemo) {
      return;
    }

    if (!this.supabase) {
      return;
    }

    // Supabase neumožňuje odhlášení pomocí service role key přímo přes access token.
    // V produkci bychom použili admin API nebo správu sessions v databázi.
    await this.supabase.auth.admin.signOut(accessToken);
  }

  private mapUser(user: {
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

  private mapSession(session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  }): AuthTokens {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? 0,
    };
  }
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload as { exp?: number };
  } catch {
    return null;
  }
}
