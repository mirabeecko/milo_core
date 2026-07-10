import type {
  Calendar,
  CalendarEvent,
  CalendarProvider,
} from "./types.js";

export class MockCalendarProvider implements CalendarProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  private calendars: Calendar[] = [];

  private events: CalendarEvent[] = [];
  private nextId = 1;

  async connect(): Promise<void> {
    // Mock provider is always connected
  }

  async disconnect(): Promise<void> {
    // Mock provider does not need disconnect
  }

  async listCalendars(): Promise<Calendar[]> {
    return this.calendars;
  }

  async listEvents(options?: { from?: string; to?: string; calendarIds?: string[] }): Promise<CalendarEvent[]> {
    let filtered = [...this.events];

    if (options?.from) {
      const from = new Date(options.from).getTime();
      filtered = filtered.filter((e) => new Date(e.end).getTime() >= from);
    }
    if (options?.to) {
      const to = new Date(options.to).getTime();
      filtered = filtered.filter((e) => new Date(e.start).getTime() <= to);
    }
    if (options?.calendarIds && options.calendarIds.length > 0) {
      filtered = filtered.filter((e) => options.calendarIds?.includes(e.calendarId));
    }

    return filtered.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  async createEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    const created: CalendarEvent = { ...event, id: `mock-event-${this.nextId++}` };
    this.events.push(created);
    return created;
  }

  async updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Event ${id} not found`);
    }
    this.events[index] = { ...this.events[index], ...event };
    return this.events[index];
  }

  async deleteEvent(id: string): Promise<void> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.events.splice(index, 1);
    }
  }
}

