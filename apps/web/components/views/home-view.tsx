"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Command,
  FileText,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  formatDateTime,
  formatRelative,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/format";
import {
  activityLog,
  briefingSnapshot,
  decisions,
  recommendation,
  todayPriorities,
} from "@/lib/mocks";
import type { ActivityLogItem, DecisionItem, PriorityItem } from "@/lib/types";
import { TtsPlayButton } from "@/components/tts/tts-play-button";
import { cn } from "@/lib/utils";

export function HomeView(): JSX.Element {
  const [now, setNow] = useState<Date | null>(null);
  const [command, setCommand] = useState("");

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!command.trim()) return;
    window.location.href = `/chat?prompt=${encodeURIComponent(command)}`;
  };

  const completedPriorities = todayPriorities.filter((p) => p.done).length;
  const progress = (completedPriorities / todayPriorities.length) * 100;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome block */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{now ? formatDateTime(now) : "Načítám..."}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dobré ráno, uživateli</h1>
            <p className="max-w-xl text-muted-foreground">
              MiLO je připraveno. Systém běží normálně, 3 agenti aktivní, 2 položky čekají na
              rozhodnutí.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Systém OK
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Bot className="h-3 w-3" />3 agenti
            </Badge>
          </div>
        </div>

        {recommendation && (
          <div className="relative z-10 mt-6 flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{recommendation.title}</h3>
                <p className="text-sm text-muted-foreground">{recommendation.description}</p>
              </div>
            </div>
            {recommendation.action && (
              <Button size="sm" className="gap-2 shrink-0">
                {recommendation.action}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Command input */}
      <form onSubmit={handleCommandSubmit} className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Command className="h-5 w-5" />
        </div>
        <Input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Co chceš udělat? Zkus: Připrav mi priority dne"
          className="h-14 rounded-xl border-border bg-card pl-10 pr-24 text-base shadow-sm placeholder:text-muted-foreground/70"
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

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Priorities */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dnešní 3 priority</CardTitle>
                <CardDescription>Nejdůležitější úkoly na dnešek</CardDescription>
              </div>
              <Badge variant="outline">{completedPriorities}/{todayPriorities.length} hotovo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <div className="space-y-3">
              {todayPriorities.map((priority) => (
                <PriorityRow key={priority.id} priority={priority} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Briefing snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Briefing snapshot</CardTitle>
            <CardDescription>Přehled ze všech zdrojů</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SnapshotItem
              icon={Mail}
              label="Nové e-maily"
              value={briefingSnapshot.unreadEmails}
            />
            <SnapshotItem
              icon={Calendar}
              label="Schůzky dnes"
              value={briefingSnapshot.upcomingMeetings}
            />
            <SnapshotItem
              icon={FileText}
              label="Nové dokumenty"
              value={briefingSnapshot.newDocuments}
            />
            <SnapshotItem
              icon={CheckCircle2}
              label="Otevřené úkoly"
              value={briefingSnapshot.openTasks}
            />
            <SnapshotItem icon={Bot} label="Aktivní agenti" value={briefingSnapshot.activeAgents} />
            <Button variant="outline" className="mt-2 w-full gap-2" asChild>
              <a href="/brief">
                Zobrazit briefing
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Decisions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Čeká na moje rozhodnutí</CardTitle>
                <CardDescription>Položky, kde systém potřebuje tebe</CardDescription>
              </div>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádná rozhodnutí nečekají.</p>
            ) : (
              decisions.map((decision) => <DecisionRow key={decision.id} decision={decision} />)
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Poslední aktivita</CardTitle>
            <CardDescription>Log posledních akcí systému</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLog.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PriorityRow({ priority }: { priority: PriorityItem }): JSX.Element {
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card">
      <div
        className={cn(
          "mt-0.5 h-2.5 w-2.5 rounded-full border",
          priority.priority === "critical" && "bg-rose-500 border-rose-500",
          priority.priority === "important" && "bg-amber-500 border-amber-500",
          priority.priority === "low" && "bg-emerald-500 border-emerald-500",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{priority.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className={cn("text-xs", getPriorityColor(priority.priority))}>
            {getPriorityLabel(priority.priority)}
          </Badge>
          {priority.project && <span>{priority.project}</span>}
          {priority.due && <span>· {priority.due}</span>}
        </div>
      </div>
    </div>
  );
}

function SnapshotItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function DecisionRow({ decision }: { decision: DecisionItem }): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{decision.title}</p>
          <Badge variant="outline" className={cn("text-xs", getStatusColor(decision.status))}>
            {getStatusLabel(decision.status)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{decision.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {decision.source} · {formatRelative(decision.date)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline">
          Odložit
        </Button>
        <Button size="sm" className="gap-1">
          <Zap className="h-3.5 w-3.5" />
          Rozhodnout
        </Button>
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: ActivityLogItem }): JSX.Element {
  const icons = {
    agent: Bot,
    system: Zap,
    user: CheckCircle2,
    integration: Zap,
  };
  const Icon = icons[item.type] ?? Zap;

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">{formatRelative(item.timestamp)}</p>
      </div>
    </div>
  );
}

