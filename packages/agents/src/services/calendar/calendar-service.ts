import type {
  Calendar,
  CalendarEvent,
  CalendarProvider,
  CalendarService,
  CalendarSuggestion,
  Conflict,
  DayAnalysis,
  TimeSlot,
} from "./types.js";

export class DefaultCalendarService implements CalendarService {
  private calendars: Calendar[] = [];
  private events: CalendarEvent[] = [];
  private lastSyncedAt?: string;

  constructor(private provider: CalendarProvider) {}

  getProvider(): CalendarProvider {
    return this.provider;
  }

  async sync(): Promise<void> {
    this.calendars = await this.provider.listCalendars();
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString();
    this.events = await this.provider.listEvents({ from, to });
    this.lastSyncedAt = new Date().toISOString();
  }

  async listEvents(options?: { from?: string; to?: string; calendarIds?: string[] }): Promise<CalendarEvent[]> {
    return this.provider.listEvents(options);
  }

  async analyzeDay(date: string): Promise<DayAnalysis> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const dayEvents = this.events.filter((e) => {
      const eventStart = new Date(e.start).getTime();
      const eventEnd = new Date(e.end).getTime();
      return eventStart <= end.getTime() && eventEnd >= start.getTime();
    });

    const totalEventMinutes = dayEvents.reduce((sum, e) => sum + eventDurationMinutes(e), 0);
    const dayMinutes = 24 * 60;
    const sleepMinutes = 8 * 60;
    const availableMinutes = dayMinutes - sleepMinutes;
    const freeMinutes = Math.max(0, availableMinutes - totalEventMinutes);

    const focusTimeMinutes = dayEvents
      .filter((e) => e.summary.toLowerCase().includes("focus"))
      .reduce((sum, e) => sum + eventDurationMinutes(e), 0);

    const deepWorkMinutes = dayEvents
      .filter((e) => e.summary.toLowerCase().includes("deep work"))
      .reduce((sum, e) => sum + eventDurationMinutes(e), 0);

    const breakMinutes = dayEvents
      .filter((e) => e.summary.toLowerCase().includes("pauza") || e.summary.toLowerCase().includes("break"))
      .reduce((sum, e) => sum + eventDurationMinutes(e), 0);

    const conflicts = this.findConflictsInternal(dayEvents);
    const overloaded = totalEventMinutes > availableMinutes * 0.7;

    const productivityScore = calculateProductivityScore({
      totalEventMinutes,
      focusTimeMinutes,
      deepWorkMinutes,
      breakMinutes,
      overloaded,
      conflictCount: conflicts.length,
    });

    return {
      date,
      totalEventMinutes,
      freeMinutes,
      focusTimeMinutes,
      deepWorkMinutes,
      breakMinutes,
      eventCount: dayEvents.length,
      conflictCount: conflicts.length,
      overloaded,
      productivityScore,
    };
  }

  async findFreeSlots(date: string, durationMinutes: number): Promise<TimeSlot[]> {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(date);
    end.setHours(18, 0, 0, 0);

    const dayEvents = this.events
      .filter((e) => {
        const es = new Date(e.start).getTime();
        const ee = new Date(e.end).getTime();
        return es < end.getTime() && ee > start.getTime();
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const slots: TimeSlot[] = [];
    let cursor = start.getTime();

    for (const event of dayEvents) {
      const eventStart = new Date(event.start).getTime();
      if (eventStart - cursor >= durationMinutes * 60_000) {
        slots.push({
          start: new Date(cursor).toISOString(),
          end: new Date(eventStart).toISOString(),
          durationMinutes: Math.floor((eventStart - cursor) / 60_000),
        });
      }
      cursor = Math.max(cursor, new Date(event.end).getTime());
    }

    if (end.getTime() - cursor >= durationMinutes * 60_000) {
      slots.push({
        start: new Date(cursor).toISOString(),
        end: end.toISOString(),
        durationMinutes: Math.floor((end.getTime() - cursor) / 60_000),
      });
    }

    return slots;
  }

  async findConflicts(date: string): Promise<Conflict[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const dayEvents = this.events.filter((e) => {
      const es = new Date(e.start).getTime();
      const ee = new Date(e.end).getTime();
      return es <= end.getTime() && ee >= start.getTime();
    });

    return this.findConflictsInternal(dayEvents);
  }

  async getSuggestions(date: string): Promise<CalendarSuggestion[]> {
    const analysis = await this.analyzeDay(date);
    const conflicts = await this.findConflicts(date);
    const suggestions: CalendarSuggestion[] = [];

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      suggestions.push({
        id: `suggest-resolve-${conflict.id}`,
        type: "move",
        title: "Přesuň kolizní schůzku",
        description: `Události „${conflict.eventA.summary}" a „${conflict.eventB.summary}" se překrývají o ${conflict.overlapMinutes} min.`,
        reason: "Kolize brání účasti na obou schůzkách a zvyšuje stres.",
        impact: "high",
        relatedEventIds: [conflict.eventA.id, conflict.eventB.id],
      });
    }

    if (analysis.focusTimeMinutes < 90) {
      suggestions.push({
        id: "suggest-focus",
        type: "focus_time",
        title: "Rezervuj Focus Time",
        description: "Dnes máš málo času na soustředěnou práci.",
        reason: "Dlouhodobá produktivita vyžaduje alespoň 90 minut focus time denně.",
        impact: "medium",
        relatedEventIds: [],
      });
    }

    if (analysis.deepWorkMinutes < 60) {
      suggestions.push({
        id: "suggest-deep-work",
        type: "deep_work",
        title: "Naplánuj Deep Work",
        description: "Chybí ti blok na hlubokou práci bez přerušení.",
        reason: "Deep work je klíčový pro složité úkoly jako vývoj nebo analýza.",
        impact: "medium",
        relatedEventIds: [],
      });
    }

    if (analysis.overloaded) {
      suggestions.push({
        id: "suggest-overload",
        type: "optimize",
        title: "Redukuj počet schůzek",
        description: "Dnes máš příliš mnoho schůzek a málo času na reakci.",
        reason: "Přetížený den vede k únavě a horší kvalitě rozhodování.",
        impact: "high",
        relatedEventIds: [],
      });
    }

    return suggestions;
  }

  async getUpcoming(limit = 10): Promise<CalendarEvent[]> {
    const now = new Date().toISOString();
    return this.events
      .filter((e) => new Date(e.start).toISOString() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit);
  }

  getLastSyncedAt(): string | undefined {
    return this.lastSyncedAt;
  }

  getCalendars(): Calendar[] {
    return this.calendars;
  }

  getEvents(): CalendarEvent[] {
    return this.events;
  }

  private findConflictsInternal(events: CalendarEvent[]): Conflict[] {
    const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const conflicts: Conflict[] = [];

    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const a = sorted[i];
        const b = sorted[j];
        if (new Date(b.start).getTime() >= new Date(a.end).getTime()) break;

        const overlapStart = Math.max(new Date(a.start).getTime(), new Date(b.start).getTime());
        const overlapEnd = Math.min(new Date(a.end).getTime(), new Date(b.end).getTime());
        const overlapMinutes = Math.max(0, Math.floor((overlapEnd - overlapStart) / 60_000));

        if (overlapMinutes > 0) {
          conflicts.push({
            id: `conflict-${a.id}-${b.id}`,
            eventA: a,
            eventB: b,
            overlapMinutes,
            severity: overlapMinutes > 30 ? "critical" : "warning",
            suggestion: `Přesuňte jednu z událostí – „${a.summary}" koliduje s „${b.summary}".`,
          });
        }
      }
    }

    return conflicts;
  }
}

function eventDurationMinutes(event: CalendarEvent): number {
  return Math.floor((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000);
}

function calculateProductivityScore(params: {
  totalEventMinutes: number;
  focusTimeMinutes: number;
  deepWorkMinutes: number;
  breakMinutes: number;
  overloaded: boolean;
  conflictCount: number;
}): number {
  let score = 70;
  score += Math.min(20, params.focusTimeMinutes / 9);
  score += Math.min(15, params.deepWorkMinutes / 6);
  score += Math.min(10, params.breakMinutes / 3);
  score -= Math.min(30, params.totalEventMinutes / 30);
  if (params.overloaded) score -= 20;
  if (params.conflictCount > 0) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}
