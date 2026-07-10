"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Filter,
  Zap,
  ChevronRight,
  PanelRightOpen,
  Layers,
  GitMerge,
  RotateCcw,
  ExternalLink,
  User,
  Wrench,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";
import { getTasks } from "@/lib/api/tasks.api";
import { getAgents } from "@/lib/api/agents.api";
import type { AgentTask, TaskStatus } from "@/lib/types";
import type { Agent } from "@/lib/types";
import { formatRelative, formatDuration } from "@/lib/format";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface LocalMission {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  status: string;
  priority: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TASK_STATUS_META: Record<
  string,
  { label: string; icon: typeof Clock; column: string; color: string }
> = {
  pending: {
    label: "Čeká",
    icon: Clock,
    column: "queued",
    color: "border-slate-500/40 bg-slate-500/10 text-slate-400",
  },
  queued: {
    label: "Ve frontě",
    icon: Layers,
    column: "queued",
    color: "border-slate-500/40 bg-slate-500/10 text-slate-400",
  },
  running: {
    label: "Probíhá",
    icon: Zap,
    column: "in_progress",
    color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  },
  waiting: {
    label: "Čeká na vstup",
    icon: Clock,
    column: "queued",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  paused: {
    label: "Pozastaveno",
    icon: Activity,
    column: "queued",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  completed: {
    label: "Hotovo",
    icon: CheckCircle2,
    column: "done",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  failed: {
    label: "Chyba",
    icon: XCircle,
    column: "failed",
    color: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  },
  cancelled: {
    label: "Zrušeno",
    icon: XCircle,
    column: "failed",
    color: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  high: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  normal: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  low: "border-slate-500/40 bg-slate-500/10 text-slate-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Kritická",
  high: "Vysoká",
  normal: "Normální",
  low: "Nízká",
};

const PRIORITY_DOTS: Record<string, string> = {
  critical: "bg-rose-500",
  high: "bg-amber-500",
  normal: "bg-blue-500",
  low: "bg-slate-500",
};

const COLUMNS = [
  { id: "queued", label: "Čeká", icon: Clock, accent: "border-slate-600" },
  { id: "in_progress", label: "Probíhá", icon: Zap, accent: "border-blue-600" },
  { id: "done", label: "Hotovo", icon: CheckCircle2, accent: "border-emerald-600" },
  { id: "failed", label: "Chyby", icon: XCircle, accent: "border-rose-600" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getColumnForStatus(status: TaskStatus): string {
  return TASK_STATUS_META[status]?.column ?? "queued";
}

function computeProgress(task: AgentTask): number {
  if (task.status === "completed") return 100;
  if (task.status === "failed" || task.status === "cancelled") return 100;
  if (!task.startedAt || !task.estimateMs) return 0;
  const now = Date.now();
  const started = new Date(task.startedAt).getTime();
  const elapsed = now - started;
  if (elapsed <= 0) return 1;
  const pct = Math.round((elapsed / task.estimateMs) * 100);
  return Math.min(99, Math.max(1, pct));
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Clock;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function AgentBadge({ agentId, agents }: { agentId: string; agents: Map<string, Agent> }) {
  const agent = agents.get(agentId);
  if (!agent) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        {agentId}
      </span>
    );
  }
  const initials = agent.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
        {initials}
      </span>
      <span className="truncate">{agent.name}</span>
    </span>
  );
}

function ToolsBar({ tools }: { tools: string[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tools.map((tool) => (
        <span
          key={tool}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
        >
          <Wrench className="h-2.5 w-2.5" />
          {tool}
        </span>
      ))}
    </div>
  );
}

function JobCard({
  task,
  agents,
  onClick,
}: {
  task: AgentTask;
  agents: Map<string, Agent>;
  onClick: (task: AgentTask) => void;
}) {
  const progress = task.status === "running" ? computeProgress(task) : undefined;
  const isRunning = task.status === "running";
  const isFailed = task.status === "failed";

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md animate-fade-in",
        isRunning && "animate-pulse-subtle",
        isFailed && "animate-pulse-failed",
      )}
      onClick={() => onClick(task)}
    >
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal,
            )}
          >
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>
        </div>

        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <AgentBadge agentId={task.ownerId} agents={agents} />
          <span className="text-[11px] text-muted-foreground">
            {formatRelative(task.createdAt)}
          </span>
        </div>

        {progress !== undefined && (
          <Progress value={progress} className="h-1" />
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
          <ToolsBar tools={task.toolsUsed.slice(0, 3)} />
          {task.toolsUsed.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{task.toolsUsed.length - 3}
            </span>
          )}
          {task.retryCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <RotateCcw className="h-2.5 w-2.5" />
              {task.retryCount}x
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Column({
  col,
  tasks,
  agents,
  onClick,
}: {
  col: (typeof COLUMNS)[number];
  tasks: AgentTask[];
  agents: Map<string, Agent>;
  onClick: (task: AgentTask) => void;
}) {
  return (
    <div className="flex min-h-[200px] flex-col rounded-xl border border-border/60 bg-card/30 p-3">
      <div className={cn("mb-3 flex items-center gap-2 border-l-2 pl-2", col.accent)}>
        <col.icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{col.label}</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2.5">
        {tasks.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">Prázdné</p>
        )}
        {tasks.map((task) => (
          <JobCard key={task.id} task={task} agents={agents} onClick={onClick} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel
// ---------------------------------------------------------------------------

function DetailPanel({
  task,
  agents,
  onClose,
  onRetry,
}: {
  task: AgentTask;
  agents: Map<string, Agent>;
  onClose: () => void;
  onRetry: (id: string) => void;
}) {
  const meta = TASK_STATUS_META[task.status] ?? TASK_STATUS_META.pending;
  const progress = task.status === "running" ? computeProgress(task) : undefined;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg animate-slide-in-right flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <PanelRightOpen className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Detail úkolu</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="text-xl font-bold">{task.title}</h2>
            {task.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal)}>
              {PRIORITY_LABELS[task.priority] ?? task.priority}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", meta.color)}>
              <meta.icon className="mr-1 h-3 w-3" />
              {meta.label}
            </Badge>
            {task.retryCount > 0 && (
              <Badge variant="outline" className="text-xs border-rose-500/40 bg-rose-500/10 text-rose-400">
                <RotateCcw className="mr-1 h-3 w-3" />
                {task.retryCount}x retry
              </Badge>
            )}
          </div>

          {progress !== undefined && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Postup</span>
              <Progress value={progress} />
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Vlastník</p>
              <AgentBadge agentId={task.ownerId} agents={agents} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Typ vlastníka</p>
              <p className="text-sm">{task.ownerType === "agent" ? "Agent" : "Uživatel"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Zdroj</p>
              <p className="text-sm capitalize">{task.source}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vytvořeno</p>
              <p className="text-sm">{formatRelative(task.createdAt)}</p>
            </div>
            {task.startedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Spuštěno</p>
                <p className="text-sm">{formatRelative(task.startedAt)}</p>
              </div>
            )}
            {task.completedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Dokončeno</p>
                <p className="text-sm">{formatRelative(task.completedAt)}</p>
              </div>
            )}
            {task.failedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Selhalo</p>
                <p className="text-sm">{formatRelative(task.failedAt)}</p>
              </div>
            )}
            {task.estimateMs && (
              <div>
                <p className="text-xs text-muted-foreground">Odhad</p>
                <p className="text-sm">{formatDuration(task.estimateMs)}</p>
              </div>
            )}
          </div>

          {task.toolsUsed.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Použité nástroje</p>
                <div className="flex flex-wrap gap-1.5">
                  {task.toolsUsed.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {task.citations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Citace</p>
                <ul className="space-y-1.5">
                  {task.citations.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="break-all">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {task.log.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Log</p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-border bg-background p-3">
                  {task.log.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={cn(
                        "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        entry.level === "error"
                          ? "bg-rose-500"
                          : entry.level === "warn"
                            ? "bg-amber-500"
                            : "bg-blue-500",
                      )} />
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString("cs-CZ")}
                      </span>
                      <span>{entry.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {task.status === "failed" && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium text-rose-500">Úkol selhal</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                onClick={() => onRetry(task.id)}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Zkusit znovu (retry #{task.retryCount + 1})
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mission View
// ---------------------------------------------------------------------------

function MissionView({
  missions,
  getTasksForMission,
  agents,
  onClick,
}: {
  missions: LocalMission[];
  getTasksForMission: (missionId: string) => AgentTask[];
  agents: Map<string, Agent>;
  onClick: (task: AgentTask) => void;
}) {
  if (missions.length === 0) {
    return (
      <EmptyState
        icon={<GitMerge className="h-10 w-10" />}
        title="Žádné mise"
        description="Aktivní mise se zobrazí zde."
      />
    );
  }

  return (
    <div className="space-y-4">
      {missions.map((mission) => {
        const childTasks = getTasksForMission(mission.id);
        const completed = childTasks.filter((t) => t.status === "completed").length;

        return (
          <Card key={mission.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base">{mission.title}</CardTitle>
                  {mission.description && (
                    <CardDescription>{mission.description}</CardDescription>
                  )}
                </div>
                <Badge variant="outline">
                  <GitMerge className="mr-1 h-3 w-3" />
                  Mise
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {childTasks.length === 0 && (
                <p className="text-xs text-muted-foreground">Žádné úkoly</p>
              )}
              {childTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background/60 p-2.5 transition-colors hover:border-primary/30"
                  onClick={() => onClick(task)}
                >
                  {TASK_STATUS_META[task.status] ? (
                    (() => {
                      const MetaIcon = TASK_STATUS_META[task.status].icon;
                      return (
                        <MetaIcon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            task.status === "completed"
                              ? "text-emerald-500"
                              : task.status === "failed"
                                ? "text-rose-500"
                                : task.status === "running"
                                  ? "text-blue-500"
                                  : "text-slate-500",
                          )}
                        />
                      );
                    })()
                  ) : (
                    <Clock className="h-4 w-4 text-slate-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {TASK_STATUS_META[task.status]?.label ?? task.status}
                      {" · "}
                      {PRIORITY_LABELS[task.priority] ?? task.priority}
                    </p>
                  </div>
                  <AgentBadge agentId={task.ownerId} agents={agents} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              {childTasks.length > 0 && (
                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <Progress
                    value={childTasks.length > 0 ? (completed / childTasks.length) * 100 : 0}
                    className="h-1.5 flex-1"
                  />
                  <span>{completed}/{childTasks.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobsPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<LocalMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "missions">("board");

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [taskData, agentData] = await Promise.all([getTasks({ limit: 200 }), getAgents()]);
      setTasks(taskData);
      setAgents(agentData);

      try {
        const res = await fetch("/api/missions");
        if (res.ok) {
          const json = await res.json();
          const missionList = Array.isArray(json) ? json : json.data ?? [];
          setMissions(missionList);
        } else {
          setMissions([]);
        }
      } catch {
        setMissions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst data"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void load();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const handleRetry = useCallback((id: string) => {
    void fetch(`/api/tasks/${id}/retry`, { method: "POST" }).then(() => load());
  }, [load]);

  // --- Derived data ---
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  let filtered = tasks;
  if (agentFilter !== "all") {
    filtered = tasks.filter((t) => t.ownerId === agentFilter);
  }

  const queued = filtered.filter((t) => getColumnForStatus(t.status) === "queued");
  const inProgress = filtered.filter((t) => getColumnForStatus(t.status) === "in_progress");
  const done = filtered.filter((t) => getColumnForStatus(t.status) === "done");
  const failed = filtered.filter((t) => getColumnForStatus(t.status) === "failed");

  const completedTodayCount = done.filter((t) => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  function getTasksForMission(missionId: string): AgentTask[] {
    return tasks.filter((t) => t.description?.includes(`mission:${missionId}`));
  }

  // --- Render ---
  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst data"
        description={error.message}
        action={
          <Button onClick={() => void load()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Zkusit znovu
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Job Board" description="Přehled všech aktivních a čekajících úkolů agentů">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Auto-refresh</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Aktivní úkoly" value={inProgress.length} icon={Zap} accent="bg-blue-500/20 text-blue-400" />
            <StatCard label="Ve frontě" value={queued.length} icon={Clock} accent="bg-slate-500/20 text-slate-400" />
            <StatCard label="Dnes dokončeno" value={completedTodayCount} icon={CheckCircle2} accent="bg-emerald-500/20 text-emerald-400" />
            <StatCard label="Chyby" value={failed.length} icon={XCircle} accent="bg-rose-500/20 text-rose-400" />
          </div>

          {/* Agent filter */}
          {agents.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <option value="all">Všichni agenti</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* No data */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-10 w-10" />}
              title="Žádné aktivní úkoly"
              description={
                agentFilter !== "all"
                  ? "Zkuste změnit filtr agentů."
                  : "Zatím nejsou žádné úkoly. Vytvořte první úkol."
              }
            />
          ) : (
            <>
              {/* View toggle */}
              <div className="flex items-center gap-2">
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "board" | "missions")}
                >
                  <TabsList className="w-auto">
                    <TabsTrigger value="board" className="gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      Job list
                    </TabsTrigger>
                    <TabsTrigger value="missions" className="gap-1.5">
                      <GitMerge className="h-3.5 w-3.5" />
                      Mise
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {viewMode === "board" ? (
                /* Kanban Board */
                <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
                  <Column col={COLUMNS[0]} tasks={queued} agents={agentMap} onClick={setSelectedTask} />
                  <Column col={COLUMNS[1]} tasks={inProgress} agents={agentMap} onClick={setSelectedTask} />
                  <Column col={COLUMNS[2]} tasks={done} agents={agentMap} onClick={setSelectedTask} />
                  <Column col={COLUMNS[3]} tasks={failed} agents={agentMap} onClick={setSelectedTask} />
                </div>
              ) : (
                /* Mission View */
                <MissionView
                  missions={missions}
                  getTasksForMission={getTasksForMission}
                  agents={agentMap}
                  onClick={setSelectedTask}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Detail panel */}
      {selectedTask && (
        <DetailPanel
          task={selectedTask}
          agents={agentMap}
          onClose={() => setSelectedTask(null)}
          onRetry={handleRetry}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2); }
          50%      { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        }
        @keyframes pulse-failed {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
          50%      { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.1); }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.35s ease-out both;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2.5s ease-in-out infinite;
        }
        .animate-pulse-failed {
          animation: pulse-failed 2s ease-in-out infinite;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
