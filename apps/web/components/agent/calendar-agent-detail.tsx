"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Zap,
  Coffee,
  Brain,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgentCalendarState, syncAgentCalendar } from "@/lib/api/agents.api";
import type { Agent, CalendarAgentState, CalendarEvent, CalendarSuggestion, DayAnalysis } from "@/lib/types";
import { formatDuration, formatRelative, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CalendarAgentDetailProps {
  agent: Agent;
}

export function CalendarAgentDetail({ agent }: CalendarAgentDetailProps): JSX.Element {
  const [state, setState] = useState<CalendarAgentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await getAgentCalendarState(agent.id);
      setState(data);
    } catch {
      setState(null);
    } finally {
      setIsLoading(false);
    }
  }, [agent.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSync(): Promise<void> {
    const result = await syncAgentCalendar(agent.id);
    setState(result.state);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Načítám kalendář...</p>;
  }

  if (!state) {
    return <p className="text-sm text-muted-foreground">Nepodařilo se načíst stav kalendáře.</p>;
  }

  const analysis = state.analysis;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Calendar Agent</h3>
          <p className="text-sm text-muted-foreground">
            {state.calendars.length} kalendářů · Poslední sync: {state.lastSyncedAt ? formatRelative(state.lastSyncedAt) : "nikdy"}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => void handleSync()}>
          <RefreshCw className="h-4 w-4" /> Synchronizovat
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<CalendarIcon className="h-4 w-4" />} label="Dnešní schůzky" value={analysis?.eventCount ?? state.todayEvents.length} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="Čas v schůzkách" value={formatDuration((analysis?.totalEventMinutes ?? 0) * 60_000)} />
        <MetricCard icon={<Zap className="h-4 w-4" />} label="Focus Time" value={formatDuration((analysis?.focusTimeMinutes ?? 0) * 60_000)} />
        <MetricCard icon={<Brain className="h-4 w-4" />} label="Deep Work" value={formatDuration((analysis?.deepWorkMinutes ?? 0) * 60_000)} />
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Produktivní skóre dne
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>{analysis.overloaded ? "Den je přetížený" : "Den je v normě"}</span>
              <span className="font-semibold">{analysis.productivityScore} / 100</span>
            </div>
            <Progress value={analysis.productivityScore} className="h-2" />
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Volný čas</div>
                <div className="font-medium">{formatDuration(analysis.freeMinutes * 60_000)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Přestávky</div>
                <div className="font-medium">{formatDuration(analysis.breakMinutes * 60_000)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Kolize</div>
                <div className={cn("font-medium", analysis.conflictCount > 0 && "text-rose-500")}>{analysis.conflictCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="schedule">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Dnes
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Sparkles className="h-4 w-4" /> Doporučení
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Kolize
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" /> Nadcházející
          </TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          <TodaySchedule events={state.todayEvents} />
        </TabsContent>
        <TabsContent value="suggestions">
          <SuggestionsList suggestions={state.suggestions} />
        </TabsContent>
        <TabsContent value="conflicts">
          <ConflictsList conflicts={state.conflicts} />
        </TabsContent>
        <TabsContent value="upcoming">
          <UpcomingList events={state.upcoming} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }): JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TodaySchedule({ events }: { events: CalendarEvent[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dnešní rozvrh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné události.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold" style={{ backgroundColor: event.color ? `${event.color}20` : undefined, color: event.color }}>
                {formatTime(event.start)}
              </div>
              <div className="flex-1">
                <div className="font-medium">{event.summary}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(event.start)} – {formatTime(event.end)} · {event.location || "Bez místa"}
                </div>
              </div>
              <Badge variant="outline">{event.calendarId}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SuggestionsList({ suggestions }: { suggestions: CalendarSuggestion[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Smart doporučení</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádná doporučení.</p>
        ) : (
          suggestions.map((s) => (
            <div key={s.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.title}</span>
                <Badge variant="outline" className={impactColor(s.impact)}>{impactLabel(s.impact)}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{s.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">💡 {s.reason}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ConflictsList({ conflicts }: { conflicts: import("@/lib/types").CalendarConflict[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kolize</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {conflicts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné kolize.</p>
        ) : (
          conflicts.map((c) => (
            <div key={c.id} className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-rose-500">
                <AlertTriangle className="h-4 w-4" />
                {c.eventA.summary} ↔ {c.eventB.summary}
              </div>
              <p className="mt-1">Překryv {c.overlapMinutes} min</p>
              {c.suggestion && <p className="mt-1 text-xs text-muted-foreground">💡 {c.suggestion}</p>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingList({ events }: { events: CalendarEvent[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nadcházející události</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné nadcházející události.</p>
        ) : (
          events.slice(0, 10).map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <div className="font-medium">{event.summary}</div>
                <div className="text-xs text-muted-foreground">{formatTime(event.start)} · {event.location || "Bez místa"}</div>
              </div>
              <Badge variant="outline">{event.calendarId}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function impactLabel(impact: CalendarSuggestion["impact"]): string {
  switch (impact) {
    case "high":
      return "Vysoký dopad";
    case "medium":
      return "Střední dopad";
    case "low":
      return "Nízký dopad";
    default:
      return impact;
  }
}

function impactColor(impact: CalendarSuggestion["impact"]): string {
  switch (impact) {
    case "high":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    default:
      return "border-border";
  }
}
