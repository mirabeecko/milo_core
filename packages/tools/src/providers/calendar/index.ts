import { google, calendar_v3 } from "googleapis";
import { CalendarEvent, ListEventsOptions } from "./types.js";

export interface CalendarClientConfig {
  accessToken: string;
  refreshToken?: string;
}

export class CalendarClient {
  private calendar;

  constructor(config: CalendarClientConfig) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  async listEvents(options: ListEventsOptions = {}): Promise<CalendarEvent[]> {
    const response = await this.calendar.events.list({
      calendarId: "primary",
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
