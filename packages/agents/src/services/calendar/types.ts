export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  isAllDay: boolean;
  organizer?: string;
  attendees: string[];
  status: "confirmed" | "tentative" | "cancelled";
  calendarId: string;
  color?: string;
}

export interface Calendar {
  id: string;
  name: string;
  color?: string;
  primary: boolean;
  provider: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface Conflict {
  id: string;
  eventA: CalendarEvent;
  eventB: CalendarEvent;
  overlapMinutes: number;
  severity: "critical" | "warning" | "info";
  suggestion?: string;
}

export interface DayAnalysis {
  date: string;
  totalEventMinutes: number;
  freeMinutes: number;
  focusTimeMinutes: number;
  deepWorkMinutes: number;
  breakMinutes: number;
  eventCount: number;
  conflictCount: number;
  overloaded: boolean;
  productivityScore: number;
}

export interface CalendarSuggestion {
  id: string;
  type: "move" | "focus_time" | "deep_work" | "break" | "cancel" | "optimize";
  title: string;
  description: string;
  reason: string;
  impact: "high" | "medium" | "low";
  relatedEventIds: string[];
  proposedStart?: string;
  proposedEnd?: string;
}

export interface CalendarProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listCalendars(): Promise<Calendar[]>;
  listEvents(options?: { from?: string; to?: string; calendarIds?: string[] }): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent>;
  updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;
}

export interface CalendarService {
  getProvider(): CalendarProvider;
  sync(): Promise<void>;
  listEvents(options?: { from?: string; to?: string; calendarIds?: string[] }): Promise<CalendarEvent[]>;
  analyzeDay(date: string): Promise<DayAnalysis>;
  findFreeSlots(date: string, durationMinutes: number): Promise<TimeSlot[]>;
  findConflicts(date: string): Promise<Conflict[]>;
  getSuggestions(date: string): Promise<CalendarSuggestion[]>;
  getUpcoming(limit?: number): Promise<CalendarEvent[]>;
}
