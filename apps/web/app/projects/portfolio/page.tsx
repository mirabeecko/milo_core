"use client";

import { useState } from "react";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Building2,
  PaintBucket,
  Wrench,
  DoorOpen,
  Banknote,
  Target,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  Hammer,
  BadgeCheck,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Demo data ────────────────────────────────────────────

interface PortfolioProject {
  id: string;
  name: string;
  url?: string;
  revenue_potential_monthly: number; // Kč/měsíc
  revenue_potential_yearly: number;
  time_remaining_minutes: number;
  progress_pct: number;
  tasks: { label: string; done: boolean; time_min?: number }[];
  deadlines: { label: string; days_left: number; campaign?: string }[];
  category: "ecommerce" | "realestate" | "service" | "other";
  priority: "critical" | "high" | "medium" | "low";
  status: "active" | "launching" | "optimizing";
}

interface PenzionRoom {
  number: number;
  name: string;
  tasks: { label: string; done: boolean; time_min?: number }[];
  revenue_uplift_daily: number;
  revenue_uplift_monthly: number;
  revenue_uplift_yearly: number;
}

const projects: PortfolioProject[] = [
  {
    id: "ninja-tyden",
    name: "ninja-tyden.cz",
    url: "https://ninja-tyden.cz",
    revenue_potential_monthly: 70000,
    revenue_potential_yearly: 840000,
    time_remaining_minutes: 30,
    progress_pct: 85,
    tasks: [
      { label: "Nastavit konverze a měření", done: false, time_min: 10 },
      { label: "Spustit FB kampaň", done: false, time_min: 10 },
      { label: "Spustit META Ads", done: false, time_min: 10 },
      { label: "Landing page hotová", done: true },
      { label: "Produkty nahrané", done: true },
      { label: "Platební brána", done: true },
    ],
    deadlines: [
      { label: "Spustit META kampaň", days_left: 5, campaign: "FINÁLNÍ ZÁSAH META" },
    ],
    category: "ecommerce",
    priority: "critical",
    status: "launching",
  },
  {
    id: "sheskates",
    name: "sheskates.cz",
    url: "https://sheskates.cz",
    revenue_potential_monthly: 45000,
    revenue_potential_yearly: 540000,
    time_remaining_minutes: 45,
    progress_pct: 72,
    tasks: [
      { label: "Dodělat design produktových stránek", done: false, time_min: 20 },
      { label: "SEO optimalizace", done: false, time_min: 15 },
      { label: "Napojit Instagram Shop", done: false, time_min: 10 },
      { label: "E-shop postavený", done: true },
      { label: "Doména + hosting", done: true },
    ],
    deadlines: [],
    category: "ecommerce",
    priority: "high",
    status: "launching",
  },
  {
    id: "penzion-hostitel",
    name: "PENZION HOSTITEL",
    revenue_potential_monthly: 120000,
    revenue_potential_yearly: 1440000,
    time_remaining_minutes: 180,
    progress_pct: 60,
    tasks: [
      { label: "Pokoj 5 — vymalovat", done: false, time_min: 120 },
      { label: "Pokoj 5 — zadělat díru ve zdi", done: false, time_min: 30 },
      { label: "Pokoj 5 — nové vybavení", done: false, time_min: 30 },
      { label: "Pokoje 1-4 hotové", done: true },
      { label: "Booking.com napojen", done: true },
      { label: "Ceník nastaven", done: true },
    ],
    deadlines: [
      { label: "Letní sezóna — všechny pokoje", days_left: 12, campaign: "LETNÍ NÁBOR 2026" },
    ],
    category: "realestate",
    priority: "critical",
    status: "optimizing",
  },
  {
    id: "brozek24",
    name: "brozek24.cz",
    revenue_potential_monthly: 25000,
    revenue_potential_yearly: 300000,
    time_remaining_minutes: 15,
    progress_pct: 95,
    tasks: [
      { label: "Finální kontrola", done: false, time_min: 15 },
      { label: "Odeslání klientovi", done: true },
      { label: "Web hotový", done: true },
    ],
    deadlines: [],
    category: "service",
    priority: "low",
    status: "active",
  },
  {
    id: "kauza-web",
    name: "kauzatjkrupka.cz",
    revenue_potential_monthly: 15000,
    revenue_potential_yearly: 180000,
    time_remaining_minutes: 60,
    progress_pct: 64,
    tasks: [
      { label: "Doplnit judikaturu", done: false, time_min: 30 },
      { label: "Responzivní verze", done: false, time_min: 30 },
      { label: "Základní web hotový", done: true },
    ],
    deadlines: [],
    category: "service",
    priority: "medium",
    status: "active",
  },
];

const penzionRooms: PenzionRoom[] = [
  {
    number: 5,
    name: "Apartmá s výhledem",
    tasks: [
      { label: "Vymalovat", done: false, time_min: 120 },
      { label: "Zadělat díru ve zdi", done: false, time_min: 30 },
      { label: "Nový nábytek (postel, skříně)", done: false, time_min: 30 },
      { label: "Zapojit TV a WiFi", done: false, time_min: 15 },
    ],
    revenue_uplift_daily: 1200,
    revenue_uplift_monthly: 36000,
    revenue_uplift_yearly: 432000,
  },
  {
    number: 6,
    name: "Rodinný pokoj",
    tasks: [
      { label: "Vyměnit koberec", done: false, time_min: 60 },
    ],
    revenue_uplift_daily: 800,
    revenue_uplift_monthly: 24000,
    revenue_uplift_yearly: 288000,
  },
  {
    number: 7,
    name: "Wellness suite",
    tasks: [
      { label: "Instalovat saunu", done: false, time_min: 480 },
      { label: "Obklady v koupelně", done: false, time_min: 240 },
    ],
    revenue_uplift_daily: 2500,
    revenue_uplift_monthly: 75000,
    revenue_uplift_yearly: 900000,
  },
];

// ─── Helpers ──────────────────────────────────────────────

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes} min`;
}

const priorityColors: Record<string, string> = {
  critical: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  high: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  medium: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  low: "text-muted-foreground border-border",
};

const priorityLabels: Record<string, string> = {
  critical: "Kritická",
  high: "Vysoká",
  medium: "Střední",
  low: "Nízká",
};

// ─── Component ────────────────────────────────────────────

export default function PortfolioPage() {
  const [sortBy, setSortBy] = useState<"revenue" | "time" | "progress">("revenue");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const sorted = [...projects].sort((a, b) => {
    if (sortBy === "revenue") return b.revenue_potential_monthly - a.revenue_potential_monthly;
    if (sortBy === "time") return a.time_remaining_minutes - b.time_remaining_minutes;
    return b.progress_pct - a.progress_pct;
  });

  const totalRevenue = projects.reduce((sum, p) => sum + p.revenue_potential_monthly, 0);
  const totalTime = projects.reduce((sum, p) => sum + p.time_remaining_minutes, 0);
  const doneTasks = projects.reduce((sum, p) => sum + p.tasks.filter((t) => t.done).length, 0);
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📊 Portfolio projektů</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Přehled všech projektů — seřazeno podle výnosového potenciálu
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "revenue" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("revenue")}
            className="gap-1.5"
          >
            <Banknote className="h-3.5 w-3.5" />
            Výnos
          </Button>
          <Button
            variant={sortBy === "time" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("time")}
            className="gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            Čas
          </Button>
          <Button
            variant={sortBy === "progress" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("progress")}
            className="gap-1.5"
          >
            <Target className="h-3.5 w-3.5" />
            Progress
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <Banknote className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-400">{formatMoney(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">měsíční potenciál</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-400">{formatTime(totalTime)}</p>
            <p className="text-xs text-muted-foreground">zbývající práce</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-400">
              {doneTasks}/{totalTasks}
            </p>
            <p className="text-xs text-muted-foreground">splněno úkolů</p>
          </CardContent>
        </Card>
      </div>

      {/* Project cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((project) => {
          const remainingTasks = project.tasks.filter((t) => !t.done);
          const isExpanded = expandedProject === project.id;
          const isPenzion = project.id === "penzion-hostitel";

          return (
            <Card
              key={project.id}
              className={cn(
                "group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.01]",
                isExpanded && "ring-2 ring-primary/30 md:col-span-2 lg:col-span-3",
              )}
            >
              {/* Priority bar */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1.5",
                  project.priority === "critical" && "bg-rose-500",
                  project.priority === "high" && "bg-amber-500",
                  project.priority === "medium" && "bg-blue-500",
                  project.priority === "low" && "bg-muted",
                )}
              />

              <CardContent className="p-5 pl-6">
                <div className={cn(isExpanded && isPenzion ? "" : "")}>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold">
                          {isPenzion && <Building2 className="h-5 w-5 inline mr-1.5 text-amber-400" />}
                          {project.name}
                        </h3>
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline shrink-0"
                          >
                            {project.url.replace("https://", "")}
                          </a>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs shrink-0", priorityColors[project.priority])}
                    >
                      {priorityLabels[project.priority]}
                    </Badge>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <Banknote className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-emerald-400">
                        {formatMoney(project.revenue_potential_monthly)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">měsíčně</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{formatTime(project.time_remaining_minutes)}</p>
                      <p className="text-[10px] text-muted-foreground">zbývá práce</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <Timer className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-amber-400">{project.progress_pct}%</p>
                      <p className="text-[10px] text-muted-foreground">hotovo</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <Progress value={project.progress_pct} className="h-2 mb-4" />

                  {/* Deadlines */}
                  {project.deadlines.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {project.deadlines.map((dl, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-2.5 text-sm",
                            dl.days_left <= 3
                              ? "border-rose-500/30 bg-rose-500/5"
                              : dl.days_left <= 7
                                ? "border-amber-500/30 bg-amber-500/5"
                                : "border-blue-500/30 bg-blue-500/5",
                          )}
                        >
                          <AlertTriangle
                            className={cn(
                              "h-4 w-4 shrink-0",
                              dl.days_left <= 3
                                ? "text-rose-400"
                                : dl.days_left <= 7
                                  ? "text-amber-400"
                                  : "text-blue-400",
                            )}
                          />
                          <span className="flex-1 font-medium">{dl.label}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs shrink-0",
                              dl.days_left <= 3
                                ? "text-rose-400 border-rose-500/30"
                                : dl.days_left <= 7
                                  ? "text-amber-400 border-amber-500/30"
                                  : "text-blue-400 border-blue-500/30",
                            )}
                          >
                            zbývá {dl.days_left} {dl.days_left === 1 ? "den" : dl.days_left <= 4 ? "dny" : "dní"}
                          </Badge>
                          {dl.campaign && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              🎯 {dl.campaign}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tasks */}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Zbývá dokončit ({remainingTasks.length})
                    </p>
                    {remainingTasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="flex-1">{task.label}</span>
                        {task.time_min && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            ~{formatTime(task.time_min)}
                          </span>
                        )}
                      </div>
                    ))}
                    {remainingTasks.length === 0 && (
                      <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                        <BadgeCheck className="h-4 w-4" />
                        Vše hotovo!
                      </p>
                    )}
                  </div>
                </div>

                {/* Expand button */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() =>
                      setExpandedProject(isExpanded ? null : project.id)
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 mr-1 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                    {isExpanded ? "Sbalit" : isPenzion ? "Detail penzionu" : "Více"}
                  </Button>
                </div>

                {/* PENZION HOSTITEL detail */}
                {isExpanded && isPenzion && (
                  <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-amber-400" />
                      Detail pokojů — potenciál příjmů po zprovoznění
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {penzionRooms.map((room) => {
                        const doneRoom = room.tasks.filter((t) => t.done).length;
                        const totalRoom = room.tasks.length;
                        const roomProgress = Math.round((doneRoom / totalRoom) * 100);

                        return (
                          <Card
                            key={room.number}
                            className="border-amber-500/10 bg-card/50"
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <DoorOpen className="h-4 w-4 text-amber-400" />
                                Pokoj č. {room.number} — {room.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Revenue uplift */}
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-emerald-400">
                                    {formatMoney(room.revenue_uplift_daily)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">/den</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-emerald-400">
                                    {formatMoney(room.revenue_uplift_monthly)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">/měsíc</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-emerald-400">
                                    {formatMoney(room.revenue_uplift_yearly)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">/rok</p>
                                </div>
                              </div>

                              <Separator />

                              {/* Room progress */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{roomProgress}%</span>
                                </div>
                                <Progress value={roomProgress} className="h-1.5" />
                              </div>

                              {/* Room tasks */}
                              <div className="space-y-1">
                                {room.tasks.map((task, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    {task.done ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    ) : (
                                      <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <span className={cn(task.done && "text-muted-foreground line-through")}>
                                      {task.label}
                                    </span>
                                    {task.time_min && !task.done && (
                                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                        ~{formatTime(task.time_min)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Total uplift summary */}
                    <Card className="mt-4 border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Celkový potenciál po zprovoznění všech pokojů
                            </p>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-center">
                              <p className="text-xl font-bold text-emerald-400">
                                {formatMoney(
                                  penzionRooms.reduce((s, r) => s + r.revenue_uplift_daily, 0),
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">denně</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-bold text-emerald-400">
                                {formatMoney(
                                  penzionRooms.reduce((s, r) => s + r.revenue_uplift_monthly, 0),
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">měsíčně</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-bold text-emerald-400">
                                {formatMoney(
                                  penzionRooms.reduce((s, r) => s + r.revenue_uplift_yearly, 0),
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">ročně</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Standard expanded view */}
                {isExpanded && !isPenzion && (
                  <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Done tasks */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          ✅ Hotovo
                        </p>
                        {project.tasks
                          .filter((t) => t.done)
                          .map((task, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span className="text-muted-foreground">{task.label}</span>
                            </div>
                          ))}
                      </div>

                      {/* Timeline estimate */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Roční potenciál
                          </p>
                          <p className="text-2xl font-bold text-emerald-400">
                            {formatMoney(project.revenue_potential_yearly)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Vaše práce
                          </p>
                          <p className="text-lg font-semibold">
                            ~{formatTime(project.time_remaining_minutes)}
                          </p>
                          <p className="text-xs text-muted-foreground">osobního času</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        ⚠️ Demo data — demonstrují monitorovací schopnosti. Řazeno:{" "}
        {sortBy === "revenue" ? "měsíční výnos ↓" : sortBy === "time" ? "čas ↑" : "progress ↓"}
      </p>
    </div>
  );
}
