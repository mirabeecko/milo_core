"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { formatDate, formatTime } from "@/lib/format";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Brain,
  Search,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{ email: string; responseStatus?: string }>;
  status?: string;
  color?: string;
  recurringEventId?: string;
}

interface SummaryDay {
  count: number;
  totalHours: number;
  firstEvent?: string;
  lastEvent?: string;
  topEvents?: string[];
}

interface ApiSummary {
  today: SummaryDay;
  tomorrow: SummaryDay;
  aiSummary: string;
}

interface CalendarResponse {
  total: number;
  events: CalendarEvent[];
  summary: ApiSummary;
}

// ─── Helpers ────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  "1": "border-l-blue-400",
  "2": "border-l-emerald-400",
  "3": "border-l-purple-400",
  "4": "border-l-red-400",
  "5": "border-l-amber-400",
  "6": "border-l-orange-400",
  "7": "border-l-teal-400",
  "8": "border-l-slate-400",
  "9": "border-l-cyan-400",
  "10": "border-l-green-400",
  "11": "border-l-pink-400",
};

function getEventBorderColor(colorId?: string): string {
  if (colorId && EVENT_COLORS[colorId]) return EVENT_COLORS[colorId];
  return "border-l-primary";
}

function getEventTime(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (sameDay) {
    return `${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${formatDate(start)} ${formatTime(start)} – ${formatDate(end)} ${formatTime(end)}`;
}

function getStatusBadge(status?: string) {
  if (!status || status === "confirmed") return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        status === "cancelled"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
      )}
    >
      {status === "cancelled" ? "Zrušeno" : "Nepotvrzeno"}
    </Badge>
  );
}

// ─── API ────────────────────────────────────────────────────────

async function fetchCalendar(): Promise<CalendarResponse> {
  const res = await fetch("/api/calendar");
  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || `HTTP ${res.status}`;
    } catch {
      message = text || `HTTP ${res.status}`;
    }
    throw new Error(message || "Nepodařilo se načíst události");
  }
  return res.json();
}

// ─── Component ──────────────────────────────────────────────────

type TabValue = "today" | "tomorrow" | "week" | "month";

const TAB_LABELS: Record<TabValue, string> = {
  today: "Dnes",
  tomorrow: "Zítra",
  week: "Týden",
  month: "Měsíc",
};

const EMPTY_MESSAGES: Record<TabValue, string> = {
  today: "Dnes žádné události",
  tomorrow: "Zítra žádné události",
  week: "Tento týden žádné události",
  month: "Tento měsíc žádné události",
};

export default function CalendarPage() {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("today");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await fetchCalendar();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání kalendáře");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filterByTab = useCallback(
    (evts: CalendarEvent[]): CalendarEvent[] => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      switch (activeTab) {
        case "today": {
          const endOfToday = new Date(now);
          endOfToday.setHours(23, 59, 59, 999);
          return evts.filter((e) => {
            const start = new Date(e.start);
            const end = new Date(e.end);
            return start <= endOfToday && end >= now;
          });
        }
        case "tomorrow": {
          const startOfTomorrow = new Date(now);
          startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
          const endOfTomorrow = new Date(startOfTomorrow);
          endOfTomorrow.setHours(23, 59, 59, 999);
          return evts.filter((e) => {
            const start = new Date(e.start);
            const end = new Date(e.end);
            return start <= endOfTomorrow && end >= startOfTomorrow;
          });
        }
        case "week": {
          const endOfWeek = new Date(now);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          endOfWeek.setHours(23, 59, 59, 999);
          return evts.filter((e) => {
            const end = new Date(e.end);
            return end >= now && new Date(e.start) <= endOfWeek;
          });
        }
        case "month": {
          const endOfMonth = new Date(now);
          endOfMonth.setDate(endOfMonth.getDate() + 30);
          endOfMonth.setHours(23, 59, 59, 999);
          return evts.filter((e) => {
            const end = new Date(e.end);
            return end >= now && new Date(e.start) <= endOfMonth;
          });
        }
      }
    },
    [activeTab]
  );

  const filteredEvents = useMemo(() => {
    const events = data?.events ?? [];
    let filtered = filterByTab(events);

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q))
      );
    }

    return filtered.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [data, search, filterByTab]);

  const summary = data?.summary;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Kalendář"
        description="Přehled událostí a AI analýza dne"
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={load}>
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Obnovit
        </Button>
      </PageHeader>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={load}>
              Zkusit znovu
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column: events ── */}
        <div className="space-y-6 lg:col-span-2">
          {isLoading ? (
            <LoadingState rows={5} />
          ) : error ? (
            <EmptyState
              variant="error"
              title="Nepodařilo se načíst události"
              description={error}
              action={
                <Button onClick={load} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Zkusit znovu
                </Button>
              }
            />
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hledat události..."
                  className="pl-9"
                />
              </div>

              {/* Tabs + events */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                <TabsList className="w-full sm:w-auto">
                  {Object.entries(TAB_LABELS).map(([value, label]) => (
                    <TabsTrigger key={value} value={value} className="flex-1 sm:flex-initial">
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.keys(TAB_LABELS).map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                    {filteredEvents.length === 0 ? (
                      <EmptyState
                        title={EMPTY_MESSAGES[tab as TabValue]}
                        description={search ? "Zkuste upravit vyhledávání." : undefined}
                        icon={<Calendar className="h-10 w-10 text-muted-foreground" />}
                      />
                    ) : (
                      filteredEvents.map((event) => (
                        <Card
                          key={event.id}
                          className={cn(
                            "rounded-xl border-l-4 transition-colors hover:border-primary/20",
                            getEventBorderColor(event.color)
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold truncate">
                                    {event.summary}
                                  </h3>
                                  {getStatusBadge(event.status)}
                                  {event.recurringEventId && (
                                    <Badge variant="outline" className="text-xs">
                                      Opakovaná
                                    </Badge>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {getEventTime(event.start, event.end)}
                                  </span>
                                  {event.location && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {event.location}
                                    </span>
                                  )}
                                  {event.attendees && event.attendees.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <Users className="h-3.5 w-3.5" />
                                      {event.attendees.length} účastníků
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </div>

        {/* ── Sidebar: AI summary + stats ── */}
        <div className="space-y-4">
          {/* AI Summary */}
          {summary ? (
            <Card className="rounded-xl border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">AI Shrnutí</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {summary.aiSummary ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {summary.aiSummary}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    AI shrnutí zatím není k dispozici.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="rounded-xl">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ) : null}

          {/* Today stats */}
          {summary?.today && (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-lg">Dnes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">{summary.today.count}</p>
                    <p className="text-xs text-muted-foreground">Událostí</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {(summary.today.totalHours ?? 0).toFixed(1)}h
                    </p>
                    <p className="text-xs text-muted-foreground">Celkem hodin</p>
                  </div>
                </div>
                {summary.today.topEvents && summary.today.topEvents.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Nejdůležitější události
                    </p>
                    {summary.today.topEvents.map((title, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                        <span className="truncate">{title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tomorrow stats */}
          {summary?.tomorrow && (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <CardTitle className="text-lg">Zítra</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">{summary.tomorrow.count}</p>
                    <p className="text-xs text-muted-foreground">Událostí</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {(summary.tomorrow.totalHours ?? 0).toFixed(1)}h
                    </p>
                    <p className="text-xs text-muted-foreground">Celkem hodin</p>
                  </div>
                </div>
                {summary.tomorrow.topEvents && summary.tomorrow.topEvents.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Naplánované události
                    </p>
                    {summary.tomorrow.topEvents.map((title, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-sm"
                      >
                        <Clock className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                        <span className="truncate">{title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Total count */}
          {data && (
            <Card className="rounded-xl">
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Celkem událostí</span>
                <span className="text-lg font-bold tabular-nums">{data.total}</span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
