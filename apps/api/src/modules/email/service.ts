import {
  GmailClient,
  createGoogleOAuthClient,
  getAuthorizationUrl,
  getTokens,
  googleScopes,
  type EmailMessage,
} from "@milo/tools";
import { config } from "../../config/index.js";

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
    return config.DEMO_MODE || !this.isConfigured();
  }

  getAuthorizationUrl(state?: string): string {
    if (!this.oauthClient) {
      return "";
    }
    return getAuthorizationUrl(this.oauthClient, googleScopes.gmail, state);
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

  async listEmails(accessToken: string, maxResults = 20): Promise<EmailMessage[]> {
    if (this.isDemo()) {
      return this.generateDemoEmails();
    }

    const client = new GmailClient({ accessToken });
    return client.listEmails({ maxResults });
  }

  generateDemoEmails(): EmailMessage[] {
    return [
      {
        id: "demo-1",
        threadId: "demo-thread-1",
        subject: "Vítej v MiLO",
        from: "MiLO Team <hello@milo.local>",
        to: ["demo@milo.local"],
        date: new Date(),
        snippet: "Děkujeme, že používáte MiLO. Toto je demo email.",
        bodyText: "Děkujeme, že používáte MiLO. Toto je demo email pro účely vývoje.",
        bodyHtml: null,
        labels: ["INBOX", "UNREAD"],
        isUnread: true,
      },
      {
        id: "demo-2",
        threadId: "demo-thread-2",
        subject: "Propojte svůj Gmail",
        from: "MiLO Setup <setup@milo.local>",
        to: ["demo@milo.local"],
        date: new Date(Date.now() - 3600_000),
        snippet: "Pro reálné emaily nastavte GOOGLE_CLIENT_ID a GOOGLE_CLIENT_SECRET.",
        bodyText: "Pro reálné emaily nastavte GOOGLE_CLIENT_ID a GOOGLE_CLIENT_SECRET v .env souboru.",
        bodyHtml: null,
        labels: ["INBOX"],
        isUnread: false,
      },
    ];
  }
}
