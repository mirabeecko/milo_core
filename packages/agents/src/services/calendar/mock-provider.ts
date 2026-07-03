import type {
  Calendar,
  CalendarEvent,
  CalendarProvider,
} from "./types.js";

export class MockCalendarProvider implements CalendarProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  private calendars: Calendar[] = [
    { id: "primary", name: "Můj kalendář", color: "#4285f4", primary: true, provider: "mock" },
    { id: "work", name: "Práce", color: "#ea4335", primary: false, provider: "mock" },
    { id: "personal", name: "Osobní", color: "#34a853", primary: false, provider: "mock" },
  ];

  private events: CalendarEvent[] = [];
  private nextId = 1;

  constructor() {
    this.events = generateMockEvents();
    this.nextId = this.events.length + 1;
  }

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

function generateMockEvents(): CalendarEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events: CalendarEvent[] = [
    {
      id: "mock-event-1",
      summary: "Ranní briefing",
      description: "Denní přehled a priority",
      location: "MiLO Dashboard",
      start: addTime(today, 8, 0),
      end: addTime(today, 8, 30),
      isAllDay: false,
      organizer: "Chief of Staff",
      attendees: [],
      status: "confirmed",
      calendarId: "primary",
      color: "#4285f4",
    },
    {
      id: "mock-event-2",
      summary: "Schůzka s klientem",
      description: "Projednání nabídky",
      location: "Google Meet",
      start: addTime(today, 10, 0),
      end: addTime(today, 11, 0),
      isAllDay: false,
      organizer: "user",
      attendees: ["klient@example.com"],
      status: "confirmed",
      calendarId: "work",
      color: "#ea4335",
    },
    {
      id: "mock-event-3",
      summary: "Deep Work: MiLO_Core",
      description: "Vývoj agentů",
      location: "",
      start: addTime(today, 11, 30),
      end: addTime(today, 13, 0),
      isAllDay: false,
      organizer: "user",
      attendees: [],
      status: "confirmed",
      calendarId: "primary",
      color: "#34a853",
    },
    {
      id: "mock-event-4",
      summary: "Kolize: Dvojí schůzka",
      description: "Tato událost koliduje",
      location: "Kancelář",
      start: addTime(today, 10, 30),
      end: addTime(today, 11, 30),
      isAllDay: false,
      organizer: "user",
      attendees: ["partner@example.com"],
      status: "confirmed",
      calendarId: "work",
      color: "#fbbc04",
    },
    {
      id: "mock-event-5",
      summary: "Focus Time: TJ Krupka",
      description: "Právní analýza",
      location: "",
      start: addTime(today, 14, 0),
      end: addTime(today, 15, 30),
      isAllDay: false,
      organizer: "user",
      attendees: [],
      status: "confirmed",
      calendarId: "primary",
      color: "#9aa0a6",
    },
    {
      id: "mock-event-6",
      summary: "Týmový standup",
      description: "Denní sync",
      location: "Zoom",
      start: addTime(today, 16, 0),
      end: addTime(today, 16, 30),
      isAllDay: false,
      organizer: "user",
      attendees: ["tym@example.com"],
      status: "confirmed",
      calendarId: "work",
      color: "#ea4335",
    },
  ];

  return events;
}

function addTime(date: Date, hours: number, minutes: number): string {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}
