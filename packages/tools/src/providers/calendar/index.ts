import { google, calendar_v3 } from "googleapis";
import { CalendarEvent, ListEventsOptions } from "./types.js";
import type { GoogleTokens } from "../google/auth.js";

export interface CalendarClientConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  onTokensRefreshed?: (tokens: GoogleTokens) => void;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary: boolean;
}

export class CalendarClient {
  private calendar;

  constructor(config: CalendarClientConfig) {
    const auth = new google.auth.OAuth2(config.clientId, config.clientSecret);
    auth.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    if (config.onTokensRefreshed) {
      auth.on("tokens", (tokens) => {
        config.onTokensRefreshed?.({
          accessToken: tokens.access_token ?? config.accessToken,
          refreshToken: tokens.refresh_token ?? config.refreshToken,
          expiryDate: tokens.expiry_date ?? undefined,
        });
      });
    }

    this.calendar = google.calendar({ version: "v3", auth });
  }

  async listCalendars(): Promise<CalendarListEntry[]> {
    const response = await this.calendar.calendarList.list();
    const items = response.data.items ?? [];
    return items.map((item) => ({
      id: item.id ?? "primary",
      summary: item.summary ?? "(Bez názvu)",
      backgroundColor: item.backgroundColor ?? undefined,
      primary: item.primary ?? false,
    }));
  }

  async listEvents(options: ListEventsOptions = {}): Promise<CalendarEvent[]> {
    const response = await this.calendar.events.list({
      calendarId: options.calendarId ?? "primary",
      maxResults: options.maxResults ?? 20,
      timeMin: options.timeMin?.toISOString(),
      timeMax: options.timeMax?.toISOString(),
      orderBy: "startTime",
      singleEvents: true,
    });

    const items = response.data.items ?? [];
    return items.map((item) => this.parseEvent(item));
  }

  private parseEvent(item: calendar_v3.Schema$Event): CalendarEvent {
    const startDate = item.start?.dateTime ?? item.start?.date;
    const endDate = item.end?.dateTime ?? item.end?.date;

    return {
      id: item.id ?? "",
      summary: item.summary ?? "(Bez názvu)",
      description: item.description ?? null,
      location: item.location ?? null,
      start: startDate ? new Date(startDate) : new Date(),
      end: endDate ? new Date(endDate) : new Date(),
      isAllDay: !!item.start?.date,
      organizer: item.organizer?.email ?? null,
      attendees: (item.attendees ?? []).map((a) => a.email ?? "").filter(Boolean),
      status: item.status ?? "confirmed",
      htmlLink: item.htmlLink ?? null,
    };
  }
}
