import {
  CalendarClient,
  createGoogleOAuthClient,
  getAuthorizationUrl,
  getTokens,
  googleScopes,
  type CalendarEvent,
} from "@milo/tools";
import { config } from "../../config/index.js";

export class CalendarService {
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
    return getAuthorizationUrl(this.oauthClient, googleScopes.calendar, state);
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

  async listEvents(accessToken: string, maxResults = 20): Promise<CalendarEvent[]> {
    if (this.isDemo()) {
      return this.generateDemoEvents();
    }

    const client = new CalendarClient({ accessToken });
    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return client.listEvents({ maxResults, timeMin: now, timeMax: endOfWeek });
  }

  generateDemoEvents(): CalendarEvent[] {
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    return [
      {
        id: "demo-cal-1",
        summary: "Ranní standup",
        description: "Denní standup s týmem.",
        location: "Google Meet",
        start: today,
        end: new Date(today.getTime() + 30 * 60 * 1000),
        isAllDay: false,
        organizer: "demo@milo.local",
        attendees: [],
        status: "confirmed",
        htmlLink: null,
      },
      {
        id: "demo-cal-2",
        summary: "Review MiLO architektury",
        description: "Architecture Review Milestone 0.",
        location: null,
        start: new Date(today.getTime() + 2 * 60 * 60 * 1000),
        end: new Date(today.getTime() + 3 * 60 * 60 * 1000),
        isAllDay: false,
        organizer: "demo@milo.local",
        attendees: [],
        status: "confirmed",
        htmlLink: null,
      },
    ];
  }
}
