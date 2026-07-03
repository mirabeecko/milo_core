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
  private oauthClient;

  constructor() {
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.GOOGLE_REDIRECT_URI) {
      throw new Error("Google OAuth credentials are not configured");
    }

    this.oauthClient = createGoogleOAuthClient({
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      redirectUri: config.GOOGLE_REDIRECT_URI,
    });
  }

  getAuthorizationUrl(state?: string): string {
    return getAuthorizationUrl(this.oauthClient, googleScopes.drive, state);
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const tokens = await getTokens(this.oauthClient, code);
    return {
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? undefined,
    };
  }

  async listFiles(accessToken: string, maxResults = 20): Promise<DriveFile[]> {
    const client = new DriveClient({ accessToken });
    return client.listFiles({ maxResults });
  }

  generateDemoFiles(): DriveFile[] {
    return [
      {
        id: "demo-drive-1",
        name: "MiLO Roadmap 2026",
        mimeType: "application/vnd.google-apps.document",
        webViewLink: "#",
        modifiedAt: new Date(),
        size: null,
        owners: ["Demo User"],
        isFolder: false,
      },
      {
        id: "demo-drive-2",
        name: "Architecture Decisions",
        mimeType: "application/vnd.google-apps.document",
        webViewLink: "#",
        modifiedAt: new Date(Date.now() - 86400_000),
        size: null,
        owners: ["Demo User"],
        isFolder: false,
      },
      {
        id: "demo-drive-3",
        name: "Finance",
        mimeType: "application/vnd.google-apps.folder",
        webViewLink: "#",
        modifiedAt: new Date(Date.now() - 172800_000),
        size: null,
        owners: ["Demo User"],
        isFolder: true,
      },
    ];
  }
}
