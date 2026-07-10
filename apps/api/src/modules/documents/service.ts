import {
  DriveClient,
  createGoogleOAuthClient,
  getAuthorizationUrl,
  getTokens,
  googleScopes,
  type DriveFile,
} from "@milo/tools";
import { config } from "../../config/index.js";

export class DocumentsService {
  private oauthClient: ReturnType<typeof createGoogleOAuthClient> | null = null;

  constructor() {
    if (this.isConfigured()) {
      this.oauthClient = createGoogleOAuthClient({
        clientId: config.GOOGLE_CLIENT_ID ?? "",
        clientSecret: config.GOOGLE_CLIENT_SECRET ?? "",
        redirectUri: config.GOOGLE_REDIRECT_URI ?? "",
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(
      config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI,
    );
  }

  isDemo(): boolean {
    return config.DEMO_MODE || !this.isConfigured();
  }

  getAuthorizationUrl(state?: string): string {
    if (!this.oauthClient) {
      return "";
    }
    return getAuthorizationUrl(this.oauthClient, googleScopes.drive, state);
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    if (!this.oauthClient) {
      throw new Error("Google OAuth is not configured");
    }

    const tokens = await getTokens(this.oauthClient, code);
    return {
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? undefined,
    };
  }

  async listFiles(_accessToken: string, maxResults = 20): Promise<DriveFile[]> {
    // Google Drive není připojen — vracejí se prázdná data
    if (this.isDemo()) {
      return [];
    }

    const client = new DriveClient({ accessToken: _accessToken });
    return client.listFiles({ maxResults });
  }
}
