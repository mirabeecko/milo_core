"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { getAccessToken } from "@/lib/api/client";
import { formatDate, formatTime } from "@/lib/format";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Unlink,
  Search,
  Sparkles,
  Zap,
  ZapOff,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AgentAnalysis {
  productivityScore?: number;
  conflictsFound?: number;
  suggestions?: string[];
  focusBlocks?: Array<{ start: string; end: string }>;
  lastRun?: string;
  running: boolean;
}

const STORAGE_KEY = "milo:calendar_connected";
const SYNC_TIME_KEY = "milo:calendar_last_sync";

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

type TabValue = "today" | "tomorrow" | "week" | "month";

export default function CalendarPage() {
  const searchParams = useSearchParams();

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [connectStatus, setConnectStatus] = useState<string>("");
  const [connectError, setConnectError] = useState<string>("");
  const [lastSync, setLastSync] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SYNC_TIME_KEY);
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("today");

  const [agent, setAgent] = useState<AgentAnalysis>({ running: false });
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [agentError, setAgentError] = useState<string>("");

  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);

  const storeConnection = useCallback((connected: boolean, syncTime?: string) => {
    setIsConnected(connected);
    if (connected) {
      localStorage.setItem(STORAGE_KEY, "true");
      if (syncTime) {
        localStorage.setItem(SYNC_TIME_KEY, syncTime);
        setLastSync(syncTime);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SYNC_TIME_KEY);
      setLastSync(null);
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && !isConnected && !isOAuthProcessing) {
      setIsOAuthProcessing(true);
      setConnectStatus("Dokončuji připojení ke Google Calendar...");

      fetch("/api/calendar/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ code, state }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Nepodařilo se dokončit připojení");
          }
          return res.json();
        })
        .then(() => {
          const now = new Date().toISOString();
          storeConnection(true, now);
          setConnectStatus("Google Calendar připojen");
          setConnectError("");
          window.history.replaceState({}, "", "/calendar");
        })
        .catch((err) => {
          setConnectError(err instanceof Error ? err.message : "Chyba při připojování kalendáře");
          setConnectStatus("");
          window.history.replaceState({}, "", "/calendar");
        })
        .finally(() => {
          setIsOAuthProcessing(false);
        });
    }
  }, [searchParams, isConnected, isOAuthProcessing, storeConnection]);

  const connectGoogle = useCallback(async () => {
    setConnectStatus("Připojování...");
    setConnectError("");
    try {
      const res = await fetch("/api/calendar/auth-url", {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setConnectError(
          "Google OAuth není nakonfigurováno – zkontroluj .env (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)"
        );
        setConnectStatus("");
      }
    } catch {
      setConnectError("Chyba připojení k serveru");
      setConnectStatus("");
    }
  }, []);

  const disconnectCalendar = useCallback(async () => {
    try {
      await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
    } catch {
      // disconnect best-effort
    }
    storeConnection(false);
    setConnectStatus("");
    setConnectError("");
    setAgent({ running: false });
  }, [storeConnection]);

  const loadEvents = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/calendar", {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Nepodařilo se načíst události");
      }
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Chyba při načítání událostí");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const syncCalendar = useCallback(async () => {
    setConnectStatus("Synchronizuji...");
    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (res.ok) {
        const now = new Date().toISOString();
        localStorage.setItem(SYNC_TIME_KEY, now);
        setLastSync(now);
        await loadEvents();
        setConnectStatus("Synchronizováno");
        setTimeout(() => setConnectStatus(""), 3000);
      }
    } catch {
      setConnectStatus("Chyba synchronizace");
    }
  }, [loadEvents]);

  const loadAgentStatus = useCallback(async () => {
    if (!isConnected) return;
    setIsLoadingAgent(true);
    setAgentError("");
    try {
      const res = await fetch("/api/calendar/agent", {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error("Agent nedostupný");
      const data = await res.json();
      setAgent({
        running: data.running ?? false,
        productivityScore: data.productivityScore,
        conflictsFound: data.conflictsFound,
        suggestions: data.suggestions,
        focusBlocks: data.focusBlocks,
        lastRun: data.lastRun,
      });
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : "Chyba při načítání stavu agenta");
      setAgent({ running: false });
    } finally {
      setIsLoadingAgent(false);
    }
  }, [isConnected]);

  const startAgent = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/agent/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (res.ok) {
        await loadAgentStatus();
      }
    } catch {
      setAgentError("Nepodařilo se spustit agenta");
    }
  }, [loadAgentStatus]);

  useEffect(() => {
    if (isConnected) {
      loadEvents();
      loadAgentStatus();
    }
  }, [isConnected, loadEvents, loadAgentStatus]);

  const filterByTab = useCallback((evts: CalendarEvent[]): CalendarEvent[] => {
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
  }, [activeTab]);

  const filteredEvents = (() => {
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
  })();

  const tabLabels: Record<TabValue, string> = {
    today: "Dnes",
    tomorrow: "Zítra",
    week: "Týden",
    month: "Měsíc",
  };

  const emptyMessages: Record<TabValue, string> = {
    today: "Dnes žádné události",
    tomorrow: "Zítra žádné události",
    week: "Tento týden žádné události",
    month: "Tento měsíc žádné události",
  };

  const getStatusBadge = (status?: string) => {
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
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Kalendář" description="Google Calendar integrace a správa času">
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Button variant="outline" size="sm" className="gap-2" onClick={syncCalendar}>
                <RefreshCw className="h-4 w-4" />
                Synchronizovat
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={disconnectCalendar}>
                <Unlink className="h-4 w-4" />
                Odpojit
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {connectError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{connectError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setConnectError("")}>
              Zavřít
            </Button>
          </CardContent>
        </Card>
      )}

      {isOAuthProcessing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <RefreshCw className="h-5 w-5 flex-shrink-0 animate-spin text-primary" />
            <p className="text-sm">{connectStatus || "Zpracovávám autorizaci..."}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!isConnected ? (
            <Card className="rounded-xl border-dashed">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Google Calendar není připojen</CardTitle>
                <CardDescription className="max-w-md mx-auto">
                  Propojte svůj Google Calendar s MiLO. Získáte přehled o událostech,
                  automatickou detekci konfliktů, návrhy focus time a optimalizaci dne.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 pb-8">
                <Button size="lg" className="gap-2" onClick={connectGoogle} disabled={isOAuthProcessing}>
                  <Link2 className="h-5 w-5" />
                  Připojit Google Calendar
                </Button>
                {connectStatus && (
                  <p className="text-sm text-muted-foreground">{connectStatus}</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Připojeno
                  </Badge>
                  {lastSync && (
                    <span className="text-xs text-muted-foreground">
                      Poslední synchronizace: {new Date(lastSync).toLocaleString("cs-CZ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-2" onClick={loadEvents}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Obnovit
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={syncCalendar}>
                    <RefreshCw className="h-4 w-4" />
                    Sync
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hledat události..."
                  className="pl-9"
                />
              </div>

              {loadError && (
                <EmptyState
                  variant="error"
                  title="Nepodařilo se načíst události"
                  description={loadError}
                  action={
                    <Button onClick={loadEvents} className="gap-2">
                      <RefreshCw className="h-4 w-4" /> Zkusit znovu
                    </Button>
                  }
                />
              )}

              {isLoading && !loadError && <LoadingState rows={5} />}

              {!isLoading && !loadError && (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                  <TabsList className="w-full sm:w-auto">
                    {Object.entries(tabLabels).map(([value, label]) => (
                      <TabsTrigger key={value} value={value} className="flex-1 sm:flex-initial">
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.keys(tabLabels).map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                      {filteredEvents.length === 0 ? (
                        <EmptyState
                          title={emptyMessages[tab as TabValue]}
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
                                    <h3 className="font-semibold truncate">{event.summary}</h3>
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
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          {!isConnected ? (
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Pro zobrazení událostí připojte Google Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Po připojení Google Calendaru se zde zobrazí analýza vašeho dne,
                  produktivní skóre, konflikty a návrhy od Calendar Agenta.
                </p>
              </CardContent>
            </Card>
          ) : isLoadingAgent ? (
            <Card className="rounded-xl">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ) : agentError ? (
            <EmptyState
              variant="error"
              title="Calendar agent"
              description={agentError}
              action={
                <Button variant="outline" size="sm" className="gap-2" onClick={loadAgentStatus}>
                  <RefreshCw className="h-4 w-4" /> Zkusit znovu
                </Button>
              }
              className="rounded-xl"
            />
          ) : (
            <>
              <Card className="rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Calendar Agent</CardTitle>
                    {agent.running ? (
                      <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <Zap className="h-3 w-3" />
                        Běží
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400">
                        <ZapOff className="h-3 w-3" />
                        Zastaven
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.running ? (
                    <>
                      {agent.productivityScore !== undefined && (
                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                          <TrendingUp className="h-5 w-5 text-emerald-400" />
                          <div>
                            <p className="text-sm font-medium">Produktivní skóre</p>
                            <p className="text-2xl font-bold">{agent.productivityScore}%</p>
                          </div>
                        </div>
                      )}

                      {agent.conflictsFound !== undefined && agent.conflictsFound > 0 && (
                        <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
                          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
                          <div>
                            <p className="text-sm font-medium">Nalezené konflikty</p>
                            <p className="text-sm text-muted-foreground">
                              {agent.conflictsFound} {agent.conflictsFound === 1 ? "konflikt" : agent.conflictsFound <= 4 ? "konflikty" : "konfliktů"} v rozvrhu
                            </p>
                          </div>
                        </div>
                      )}

                      {agent.suggestions && agent.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Doporučení</p>
                          {agent.suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 rounded-lg bg-muted/30 p-2 text-sm text-muted-foreground"
                            >
                              <Sparkles className="h-4 w-4 flex-shrink-0 text-primary mt-px" />
                              {s}
                            </div>
                          ))}
                        </div>
                      )}

                      {agent.focusBlocks && agent.focusBlocks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Focus bloky</p>
                          {agent.focusBlocks.map((fb, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 rounded-lg bg-primary/10 p-2 text-sm"
                            >
                              <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                              <span>
                                {formatTime(fb.start)} – {formatTime(fb.end)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {agent.lastRun && (
                        <p className="text-xs text-muted-foreground">
                          Poslední analýza: {new Date(agent.lastRun).toLocaleString("cs-CZ")}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <ZapOff className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">Calendar agent není spuštěn</p>
                      </div>
                      <Button className="w-full gap-2" onClick={startAgent}>
                        <Zap className="h-4 w-4" />
                        Spustit agenta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {events.length > 0 && (
                <Card className="rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Přehled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">{events.length}</p>
                        <p className="text-xs text-muted-foreground">Celkem událostí</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">
                          {events.filter((e) => {
                            const now = new Date();
                            now.setHours(0, 0, 0, 0);
                            const endOfToday = new Date(now);
                            endOfToday.setHours(23, 59, 59, 999);
                            const start = new Date(e.start);
                            return start <= endOfToday && new Date(e.end) >= now;
                          }).length}
                        </p>
                        <p className="text-xs text-muted-foreground">Dnes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
