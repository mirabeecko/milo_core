"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Command,
  Database,
  FolderKanban,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getHomeData, type HomeData } from "@/lib/api/home.api";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { LiveClock } from "@/components/widgets/live-clock";
import { RemindersWidget } from "@/components/widgets/reminders-widget";
import { cn } from "@/lib/utils";

function dataSourceLabel(source: string): string {
  switch (source) {
    case "live":
      return "Data: realná";
    case "demo":
      return "Data: demo";
    case "partial":
      return "Data: částečná";
    default:
      return "Data: není k dispozici";
  }
}

function DataSourceBadge({ source }: { source: string }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 pt-2 border-t border-border mt-auto">
      <Database className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">{dataSourceLabel(source)}</span>
    </div>
  );
}

export function HomeView(): JSX.Element {
  const [command, setCommand] = useState("");
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [calendarView, setCalendarView] = useState<"today" | "tomorrow" | "week">("today");

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);
        const homeData = await getHomeData();
        setData(homeData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Nepodařilo se načíst dashboard"));
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const handleCommandSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!command.trim()) return;
    window.location.href = `/chat?prompt=${encodeURIComponent(command)}`;
  };

  if (isLoading) {
    return <LoadingState rows={8} />;
  }

  if (error || !data) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst dashboard"
        description={error?.message ?? "Zkuste obnovit stránku."}
      />
    );
  }

  const isDemo = !data.weather;
  const dataSource = isDemo ? "demo" : "live";

  const completedPriorities = data.priorities.filter((p) => p.done).length;
  const progress = data.priorities.length > 0
    ? (completedPriorities / data.priorities.length) * 100
    : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* KPI Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 p-4 md:p-6 shadow-sm"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(262 70% 50% / 0.08) 40%, hsl(220 70% 50% / 0.04) 100%)",
        }}
      >
        <div className="absolute inset-0 bg-dot-pattern opacity-60" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {data.snapshot.activeAgents} agenti aktivní ·{" "}
                {data.decisions.length} čeká na rozhodnutí
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-gradient">Dobrý den, uživateli</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              {data.priorities.filter((p) => p.priority === "critical").length} kritické
              priority · {data.aiSummary.totalVisits.toLocaleString("cs-CZ")} návštěv na webech
            </p>
          </div>
          <div className="flex-shrink-0 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: "0s" }} />
              <div className="absolute h-20 w-20 rounded-full bg-primary/8 animate-pulse-ring" style={{ animationDelay: "0.8s" }} />
              <div className="absolute h-20 w-20 rounded-full bg-primary/5 animate-pulse-ring" style={{ animationDelay: "1.6s" }} />
            </div>
            <LiveClock />
          </div>
        </div>

        {/* KPI cards */}
        <div className="relative z-10 mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Projekty"
            value={data.snapshot.openTasks}
            icon={FolderKanban}
            trend={data.snapshot.openTasks > 0 ? "up" : "neutral"}
            trendLabel="aktivních"
            href="/projects"
          />
          <KpiCard
            label="Schůzky dnes"
            value={data.snapshot.upcomingMeetings}
            icon={Calendar}
            trend="neutral"
            trendLabel={data.snapshot.upcomingMeetings > 0 ? "naplánováno" : "žádné"}
            href="/calendar"
          />
          <KpiCard
            label="E-maily"
            value={data.snapshot.unreadEmails}
            icon={Mail}
            trend="down"
            trendLabel="nepřečtených"
            href="/email"
          />
          <KpiCard
            label="Úkoly"
            value={data.snapshot.openTasks}
            icon={CheckCircle2}
            trend="up"
            trendLabel="otevřených"
            href="/tasks"
          />
          <KpiCard
            label="Agenti"
            value={data.snapshot.activeAgents}
            icon={Bot}
            trend="neutral"
            trendLabel="online"
            href="/agents"
          />
          <KpiCard
            label="Dokumenty"
            value={data.snapshot.newDocuments}
            icon={Sparkles}
            trend="down"
            trendLabel="nových"
            href="/documents"
          />
        </div>
      </section>

      {/* Command bar */}
      <form onSubmit={handleCommandSubmit} className="relative hidden sm:block">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Command className="h-5 w-5" />
        </div>
        <Input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Co chceš udělat? Zkus: Připrav mi priority dne"
          className="h-14 rounded-xl border-border bg-card pl-10 pr-24 text-base shadow-sm"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          disabled={!command.trim()}
        >
          Poslat
        </Button>
      </form>

      {/* Main dashboard grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Reminders - full width */}
        <div className="lg:col-span-3">
          <RemindersWidget />
        </div>

        {/* Priorities */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">Klíčové priority</CardTitle>
                <CardDescription>Nejdůležitější úkoly na dnešek</CardDescription>
              </div>
              <Badge variant="outline">
                {completedPriorities}/{data.priorities.length} hotovo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="space-y-2">
              {data.priorities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Žádné priority. Vytvoř nový projekt a nastav mu prioritu.
                </p>
              ) : (
                data.priorities.map((priority, i) => (
                  <PriorityItem key={priority.id} priority={priority} index={i} />
                ))
              )}
            </div>
            <DataSourceBadge source={dataSource} />
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kalendář</CardTitle>
            <div className="flex gap-1 mt-1">
              {(["today", "tomorrow", "week"] as const).map((v) => (
                <Button
                  key={v}
                  variant={calendarView === v ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setCalendarView(v)}
                >
                  {{ today: "Dnes", tomorrow: "Zítra", week: "Týden" }[v]}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {data.calendar[calendarView].length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Žádné události
              </p>
            ) : (
              data.calendar[calendarView].slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 rounded-lg border border-border p-2.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventTime(event.start, calendarView)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link href="/calendar">
                Zobrazit vše <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <DataSourceBadge source={dataSource} />
          </CardContent>
        </Card>

        {/* AI Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI souhrn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isDemo && !data.aiSummary.siteVisits.length ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="rounded-full bg-amber-500/10 p-3 text-amber-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">AI souhrn není k dispozici</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Připojte Google Analytics pro reálná data.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
                  <div className="rounded-md bg-rose-500/10 p-2 text-rose-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{data.aiSummary.unreadEmails}</p>
                    <p className="text-xs text-muted-foreground">nepřečtených e-mailů</p>
                  </div>
                </div>
                {data.aiSummary.siteVisits.length > 0 && (
                  <div className="space-y-2">
                    {data.aiSummary.siteVisits.slice(0, 3).map((site) => (
                      <div
                        key={site.site}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-2.5"
                      >
                        <span className="text-sm font-medium">{site.site}</span>
                        <span className="text-sm text-muted-foreground">
                          {site.visits} návštěv
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-sm text-muted-foreground">{data.aiSummary.insight}</p>
                </div>
              </>
            )}
            <DataSourceBadge source={dataSource} />
          </CardContent>
        </Card>

        {/* Weather */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              Počasí
            </CardTitle>
            <CardDescription>
              {data.weather.location}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isDemo ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="rounded-full bg-muted p-3 text-muted-foreground">
                  <Cloud className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Počasí není k dispozici</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Pro zobrazení reálných dat o počasí připojte službu počasí.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-3">
                  <WeatherIcon condition={data.weather.condition} />
                  <div>
                    <p className="text-2xl font-bold">{data.weather.temperature}°C</p>
                    <p className="text-xs text-muted-foreground">
                      Pocitově {data.weather.feelsLike}°C
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-lg border border-border bg-card/50 p-2 text-center">
                    <span className="block font-medium text-foreground">
                      {data.weather.humidity}%
                    </span>
                    Vlhkost
                  </div>
                  <div className="rounded-lg border border-border bg-card/50 p-2 text-center">
                    <span className="block font-medium text-foreground">
                      {data.weather.windSpeed} km/h
                    </span>
                    Vítr
                  </div>
                </div>
                {data.weather.forecast.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Předpověď</p>
                    {data.weather.forecast.slice(0, 4).map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-2"
                      >
                        <span className="text-xs">{f.time}</span>
                        <span className="text-xs font-medium">{f.temperature}°C</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <DataSourceBadge source={dataSource} />
          </CardContent>
        </Card>

        {/* Decisions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Čeká na rozhodnutí</CardTitle>
                <CardDescription>Položky, kde systém potřebuje tebe</CardDescription>
              </div>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                Žádná rozhodnutí nečekají.
              </p>
            ) : (
              data.decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{decision.title}</p>
                    {decision.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {decision.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          decision.status === "pending" && "text-amber-500 border-amber-500/30",
                          decision.status !== "pending" && "text-emerald-500 border-emerald-500/30",
                        )}
                      >
                        {decision.status === "pending" ? "Čeká" : "Vyřešeno"}
                      </Badge>
                      {decision.source && (
                        <span className="text-xs text-muted-foreground">{decision.source}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Odložit
                    </Button>
                    <Button size="sm" className="h-8 text-xs gap-1">
                      <Zap className="h-3 w-3" />
                      Rozhodnout
                    </Button>
                  </div>
                </div>
              ))
            )}
            <DataSourceBadge source={dataSource} />
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Poslední aktivita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Žádná nedávná aktivita.
              </p>
            ) : (
              data.activityLog.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div
                    className={cn(
                      "mt-0.5 rounded-md p-1.5",
                      item.type === "agent" && "bg-primary/10 text-primary",
                      item.type === "user" && "bg-emerald-500/10 text-emerald-500",
                      item.type === "system" && "bg-amber-500/10 text-amber-500",
                      item.type === "integration" && "bg-violet-500/10 text-violet-500",
                    )}
                  >
                    {item.type === "agent" ? (
                      <Bot className="h-3.5 w-3.5" />
                    ) : item.type === "user" ? (
                      <Users className="h-3.5 w-3.5" />
                    ) : item.type === "system" ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(item.timestamp).toLocaleString("cs-CZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <DataSourceBadge source={dataSource} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WeatherIcon({ condition }: { condition: string }): JSX.Element {
  const size = "h-10 w-10";
  switch (condition) {
    case "clear":
      return (
        <div className="rounded-full bg-amber-500/10 p-2 text-amber-500">
          <svg
            className={size}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </div>
      );
    case "cloudy":
      return (
        <div className="rounded-full bg-slate-500/10 p-2 text-slate-500">
          <svg
            className={size}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
          </svg>
        </div>
      );
    case "rain":
      return (
        <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
          <svg
            className={size}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M16 13v5M8 13v5M12 15v5M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
          </svg>
        </div>
      );
    case "snow":
      return (
        <div className="rounded-full bg-cyan-500/10 p-2 text-cyan-500">
          <Cloud className={size} />
        </div>
      );
    case "storm":
      return (
        <div className="rounded-full bg-violet-500/10 p-2 text-violet-500">
          <svg
            className={size}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      );
    case "fog":
      return (
        <div className="rounded-full bg-gray-400/10 p-2 text-gray-400">
          <svg
            className={size}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M3 15h18M3 19h18M3 11h18" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          <Cloud className={size} />
        </div>
      );
  }
}

function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  href,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
  trendLabel: string;
  href: string;
}): JSX.Element {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm p-3 hover:bg-background/60 hover:border-primary/30 transition-all hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
        {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
        {trend === "neutral" && (
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        )}
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">
          {label}
          <span className="hidden sm:inline"> · {trendLabel}</span>
        </p>
      </div>
    </Link>
  );
}

function PriorityItem({
  priority,
  index,
}: {
  priority: { id: string; title: string; priority: string; project?: string; due?: string; done: boolean; source?: "user" | "agent"; agentName?: string };
  index: number;
}): JSX.Element {
  const colors: Record<string, string> = {
    critical: "bg-rose-500",
    important: "bg-amber-500",
    low: "bg-emerald-500",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        priority.done
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-border hover:bg-accent/50",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
          colors[priority.priority] ?? "bg-muted-foreground",
        )}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium truncate",
            priority.done && "line-through text-muted-foreground",
          )}
        >
          {priority.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {priority.source === "agent" && priority.agentName ? (
            <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-0.5">
              <Bot className="h-2.5 w-2.5" />
              Od agenta: {priority.agentName}
            </Badge>
          ) : priority.source === "user" ? (
            <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5">
              <Users className="h-2.5 w-2.5" />
              Můj úkol
            </Badge>
          ) : null}
          {priority.project && (
            <Link
              href={`/projects?id=${encodeURIComponent(priority.project)}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {priority.project}
            </Link>
          )}
          {priority.due && (
            <span className="text-xs text-muted-foreground">· {priority.due}</span>
          )}
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-xs shrink-0",
          priority.priority === "critical" && "text-rose-500 border-rose-500/30",
          priority.priority === "important" && "text-amber-500 border-amber-500/30",
          priority.priority === "low" && "text-emerald-500 border-emerald-500/30",
        )}
      >
        {priority.priority === "critical"
          ? "Kritická"
          : priority.priority === "important"
            ? "Důležitá"
            : "Nízká"}
      </Badge>
    </div>
  );
}

function formatEventTime(iso: string, view: "today" | "tomorrow" | "week"): string {
  try {
    const d = new Date(iso);
    if (view === "week") {
      return `${d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric" })}, ${d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
