import {
  GmailClient,
  createGoogleOAuthClient,
  getAuthorizationUrl,
  getTokens,
  googleScopes,
  type EmailMessage,
} from "@milo/tools";
import { config } from "../../config/index.js";
import { setGoogleTokens } from "../../config/google-tokens.js";

export class EmailService {
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
    return !this.isConfigured();
  }

  getAuthorizationUrl(state?: string): string {
    if (!this.oauthClient) {
      return "";
    }
    return getAuthorizationUrl(this.oauthClient, googleScopes.gmail, state);
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiryDate?: number }> {
    if (!this.oauthClient) {
      throw new Error("Google OAuth is not configured");
    }

    const tokens = await getTokens(this.oauthClient, code);
    return {
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: tokens.expiry_date ?? undefined,
    };
  }

  async listEmails(
    userId: string,
    accessToken: string,
    refreshToken: string | undefined,
    maxResults = 20,
  ): Promise<EmailMessage[]> {
    // Gmail není připojen — vracejí se prázdná data
    if (this.isDemo()) {
      return [];
    }

    const client = new GmailClient({
      accessToken,
      refreshToken,
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      onTokensRefreshed: (tokens) => void setGoogleTokens(userId, "email", tokens),
    });
    return client.listEmails({ maxResults });
  }
}
