export interface CalendarEvent {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date;
  isAllDay: boolean;
  organizer: string | null;
  attendees: string[];
  status: string;
  htmlLink: string | null;
}

export interface ListEventsOptions {
  maxResults?: number;
  timeMin?: Date;
  timeMax?: Date;
  calendarId?: string;
}
