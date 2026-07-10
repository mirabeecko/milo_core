import type { CalendarClient } from "@milo/tools";
import type { Calendar, CalendarEvent, CalendarProvider } from "./types.js";

export class GoogleCalendarProvider implements CalendarProvider {
  readonly name = "google";
  readonly isConfigured = true;

  constructor(private client: CalendarClient) {}

  async connect(): Promise<void> {
    // Connection is established by the caller via OAuth tokens.
  }

  async disconnect(): Promise<void> {
    // Tokens are managed by the caller.
  }

  async listCalendars(): Promise<Calendar[]> {
    const calendars = await this.client.listCalendars();
    return calendars.map((c) => ({
      id: c.id,
      name: c.summary,
      color: c.backgroundColor,
      primary: c.primary,
      provider: "google",
    }));
  }

  async listEvents(options?: { from?: string; to?: string; calendarIds?: string[] }): Promise<CalendarEvent[]> {
    const events = await this.client.listEvents({
      maxResults: 250,
      timeMin: options?.from ? new Date(options.from) : undefined,
      timeMax: options?.to ? new Date(options.to) : undefined,
    });

    return events.map((event) => ({
      id: event.id,
      summary: event.summary,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      isAllDay: event.isAllDay,
      organizer: event.organizer ?? undefined,
      attendees: event.attendees,
      status: (event.status as CalendarEvent["status"]) ?? "confirmed",
      calendarId: "primary",
    }));
  }

  async createEvent(): Promise<CalendarEvent> {
    throw new Error("Vytváření událostí zatím není podporováno – kalendářová integrace je pouze pro čtení.");
  }

  async updateEvent(): Promise<CalendarEvent> {
    throw new Error("Úprava událostí zatím není podporována – kalendářová integrace je pouze pro čtení.");
  }

  async deleteEvent(): Promise<void> {
    throw new Error("Mazání událostí zatím není podporováno – kalendářová integrace je pouze pro čtení.");
  }
}
