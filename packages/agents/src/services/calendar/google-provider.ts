import type {
  Calendar,
  CalendarEvent,
  CalendarProvider,
} from "./types.js";

export interface GoogleCalendarProviderConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
}

export class GoogleCalendarProvider implements CalendarProvider {
  readonly name = "google";
  readonly isConfigured: boolean;

  constructor(private config: GoogleCalendarProviderConfig = {}) {
    this.isConfigured = Boolean(config.accessToken);
  }

  async connect(): Promise<void> {
    throw new Error("Google Calendar OAuth flow is not implemented yet");
  }

  async disconnect(): Promise<void> {
    // Clear tokens
  }

  async listCalendars(): Promise<Calendar[]> {
    this.requireConfigured();
    throw new Error("Google Calendar API not implemented yet");
  }

  async listEvents(_options?: { from?: string; to?: string; calendarIds?: string[] }): Promise<CalendarEvent[]> {
    this.requireConfigured();
    throw new Error("Google Calendar API not implemented yet");
  }

  async createEvent(_event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    this.requireConfigured();
    throw new Error("Google Calendar API not implemented yet");
  }

  async updateEvent(_id: string, _event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    this.requireConfigured();
    throw new Error("Google Calendar API not implemented yet");
  }

  async deleteEvent(_id: string): Promise<void> {
    this.requireConfigured();
    throw new Error("Google Calendar API not implemented yet");
  }

  private requireConfigured(): void {
    if (!this.isConfigured) {
      throw new Error("Google Calendar provider is not configured");
    }
  }
}
