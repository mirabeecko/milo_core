"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, Clock, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  isAllDay: boolean;
  organizer: string | null;
  attendees: string[];
  status: string;
}

export default function CalendarPage(): JSX.Element {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents(): Promise<void> {
      try {
        const response = await fetch("/api/calendar", {
          headers: { Authorization: "Bearer demo-token" },
        });

        if (!response.ok) {
          throw new Error("Nepodařilo se načíst události");
        }

        const data = (await response.json()) as { events: CalendarEvent[] };
        setEvents(data.events);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchEvents();
  }, []);

  const formatTime = (date: string, isAllDay: boolean): string => {
    if (isAllDay) return "Celý den";
    return new Date(date).toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
            <p className="text-muted-foreground">Přehled nadcházejících událostí z Google Calendar.</p>
          </div>
          <Button variant="outline">Připojit Calendar</Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Načítám události...</p>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">Žádné události k zobrazení.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarIcon className="h-5 w-5" />
                  <span className="text-xs font-semibold">
                    {new Date(event.start).toLocaleDateString("cs-CZ", { day: "numeric" })}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{event.summary}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(event.start, event.isAllDay)} – {formatTime(event.end, event.isAllDay)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && <p className="text-sm">{event.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
