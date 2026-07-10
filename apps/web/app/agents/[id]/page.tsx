"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Gauge,
  History,
  ListTodo,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  Square,
  Terminal,
  Timer,
  Wrench,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import {
  getAgent,
  getAgentExplanation,
  getAgentLogs,
  getAgentMemory,
  getAgentMetrics,
  getAgentTaskHistory,
  getAgentTaskQueue,
  pauseAgent,
  restartAgent,
  resumeAgent,
  startAgent,
  stopAgent,
} from "@/lib/api/agents.api";
import { formatDate, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  Agent,
  AgentLogEntry,
  AgentMetrics,
  AgentStatus,
  AgentTask,
  LiveWorkExplanation,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers (recreated from agent-card.tsx since not exported)
// ---------------------------------------------------------------------------

function statusLabel(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    thinking: "Přemýšlí",
    planning: "Plánuje",
    delegating: "Deleguje",
    working: "Pracuje",
    waiting: "Čeká na vstup",
    reviewing: "Kontroluje",
    reporting: "Reportuje",
    loading_calendar: "Načítá kalendář",
    loading_messages: "Načítá zprávy",
    analyzing: "Analyzuje",
    scheduling: "Plánuje",
    summarizing: "Shrnuje",
    drafting_reply: "Píše odpověď",
    reading_code: "Čte kód",
    implementing: "Implementuje",
    testing: "Testuje",
    building: "Buildí",
    deploying: "Deployuje",
    starting: "Spouští se",
    stopping: "Zastavuje se",
    recovering: "Obnovuje se",
    idle: "Čeká",
    paused: "Pozastaveno",
    offline: "Offline",
    error: "Chyba",
  };
  return map[status] ?? status;
}

function statusColor(status: AgentStatus): string {
  switch (status) {
    case "working":
    case "delegating":
    case "reviewing":
    case "reporting":
    case "scheduling":
    case "implementing":
    case "testing":
    case "building":
    case "deploying":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    case "thinking":
    case "planning":
    case "analyzing":
    case "reading_code":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "idle":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "starting":
      return "border-sky-500/30 bg-sky-500/10 text-sky-500";
    case "stopping":
    case "recovering":
      return "border-orange-500/30 bg-orange-500/10 text-orange-500";
    case "waiting":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-500";
    case "loading_calendar":
    case "loading_messages":
      return "border-purple-500/30 bg-purple-500/10 text-purple-500";
    case "summarizing":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-500";
    case "drafting_reply":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-500";
    case "paused":
      return "border-slate-500/30 bg-slate-500/10 text-slate-500";
    case "offline":
      return "border-slate-700/30 bg-slate-700/10 text-slate-400";
    case "error":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    default:
      return "border-border";
  }
}

function statusDotColor(status: AgentStatus): string {
  switch (status) {
    case "working":
    case "delegating":
    case "reviewing":
    case "reporting":
    case "scheduling":
    case "implementing":
    case "testing":
    case "building":
    case "deploying":
      return "bg-emerald-500";
    case "thinking":
    case "planning":
    case "analyzing":
    case "reading_code":
      return "bg-amber-500";
    case "idle":
      return "bg-blue-500";
    case "starting":
      return "bg-sky-500";
    case "stopping":
    case "recovering":
      return "bg-orange-500";
    case "waiting":
      return "bg-cyan-500";
    case "loading_calendar":
    case "loading_messages":
      return "bg-purple-500";
    case "summarizing":
      return "bg-cyan-500";
    case "drafting_reply":
      return "bg-indigo-500";
    case "paused":
      return "bg-slate-500";
    case "offline":
      return "bg-slate-700";
    case "error":
      return "bg-rose-500";
    default:
      return "bg-slate-500";
  }
}

function hudBorderColor(status: AgentStatus): string {
  switch (status) {
    case "working":
    case "delegating":
    case "reviewing":
    case "reporting":
    case "scheduling":
    case "implementing":
    case "testing":
    case "building":
    case "deploying":
      return "var(--hud-green)";
    case "idle":
    case "thinking":
    case "planning":
    case "analyzing":
    case "reading_code":
    case "starting":
    case "waiting":
    case "loading_calendar":
    case "loading_messages":
    case "summarizing":
    case "drafting_reply":
      return "var(--hud-blue)";
    case "paused":
      return "var(--hud-amber)";
    case "error":
    case "stopping":
    case "recovering":
      return "var(--hud-red)";
    case "offline":
      return "#52525b";
    default:
      return "var(--hud-border)";
  }
}

function isOperationalStatus(status: AgentStatus): boolean {
  return [
    "thinking",
    "planning",
    "delegating",
    "working",
    "waiting",
    "reviewing",
    "reporting",
    "loading_calendar",
    "loading_messages",
    "analyzing",
    "scheduling",
    "summarizing",
    "drafting_reply",
    "reading_code",
    "implementing",
    "testing",
    "building",
    "deploying",
  ].includes(status);
}

function healthColor(health: Agent["health"]["status"]): string {
  return {
    healthy: "bg-emerald-500",
    degraded: "bg-amber-500",
    unhealthy: "bg-rose-500",
  }[health];
}

function healthLabel(health: Agent["health"]["status"]): string {
  return {
    healthy: "Zdravý",
    degraded: "Degradovaný",
    unhealthy: "Nefunkční",
  }[health];
}

function taskStatusLabel(s: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending: "Čeká",
    queued: "Ve frontě",
    running: "Běží",
    waiting: "Čeká na vstup",
    paused: "Pozastaveno",
    completed: "Dokončeno",
    failed: "Chyba",
    cancelled: "Zrušeno",
  };
  return map[s] ?? s;
}

function taskStatusColor(s: TaskStatus): string {
  switch (s) {
    case "running":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    case "completed":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "pending":
    case "queued":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-500";
    case "waiting":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "paused":
      return "border-slate-500/30 bg-slate-500/10 text-slate-500";
    case "failed":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "cancelled":
      return "border-slate-700/30 bg-slate-700/10 text-slate-400";
    default:
      return "border-border";
  }
}

function taskPriorityLabel(p: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    critical: "Kritická",
    high: "Vysoká",
    normal: "Normální",
    low: "Nízká",
  };
  return map[p] ?? p;
}

function taskPriorityColor(p: TaskPriority): string {
  switch (p) {
    case "critical":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "high":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "normal":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    default:
      return "border-border";
  }
}

function priorityLabel(p: Agent["priority"]): string {
  const map: Record<string, string> = {
    critical: "Kritická",
    high: "Vysoká",
    normal: "Normální",
    low: "Nízká",
  };
  return map[p] ?? p;
}

function priorityColor(p: Agent["priority"]): string {
  switch (p) {
    case "critical":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "high":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "normal":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    default:
      return "border-border";
  }
}

function logLevelColor(level: AgentLogEntry["level"]): string {
  switch (level) {
    case "info":
      return "text-blue-400";
    case "warn":
      return "text-amber-400";
    case "error":
      return "text-rose-400";
    case "debug":
      return "text-gray-500";
    default:
      return "text-muted-foreground";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: AgentStatus }): JSX.Element {
  const color = statusDotColor(status);
  const shouldPulse = [
    "working", "delegating", "reviewing", "reporting", "scheduling",
    "implementing", "testing", "building", "deploying", "thinking",
    "planning", "analyzing", "reading_code", "starting",
  ].includes(status);
  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
        color,
        shouldPulse && "animate-pulse",
      )}
    />
  );
}

function HealthIndicator({ health }: { health: Agent["health"]["status"] }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5" title={`Health: ${healthLabel(health)}`}>
      <span className={cn("h-2 w-2 rounded-full", healthColor(health))} />
      <span className="text-xs text-muted-foreground">{healthLabel(health)}</span>
    </div>
  );
}

function ConfettiMini({ confidence }: { confidence: string }): JSX.Element {
  const pct = parseInt(confidence.replace("%", ""), 10);
  const color =
    isNaN(pct) ? "bg-slate-500" : pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-sm font-mono">{confidence}</span>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="rounded-lg border border-[var(--hud-border)] bg-card/50 p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function ExplanationField({
  label,
  icon: Icon,
  children,
  highlight,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  highlight?: boolean;
}): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--hud-border)] p-3",
        highlight && "border-[var(--hud-green)]/40 bg-[var(--hud-green)]/5",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function TaskCard({ task }: { task: AgentTask }): JSX.Element {
  return (
    <div className="rounded-lg border border-[var(--hud-border)] bg-card/50 p-3 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{task.title}</span>
          <Badge variant="outline" className={cn("text-xs", taskStatusColor(task.status))}>
            {taskStatusLabel(task.status)}
          </Badge>
          <Badge variant="outline" className={cn("text-xs", taskPriorityColor(task.priority))}>
            {taskPriorityLabel(task.priority)}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          {task.createdAt && <span>Vytvořeno: {formatDate(task.createdAt)}</span>}
          {task.toolsUsed.length > 0 && (
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {task.toolsUsed.join(", ")}
            </span>
          )}
          {task.retryCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <RotateCcw className="h-3 w-3" />
              Retry: {task.retryCount}x
            </span>
          )}
        </div>
      </div>
      {task.status === "running" && (
        <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [taskQueue, setTaskQueue] = useState<AgentTask[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [memory, setMemory] = useState<unknown[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<unknown[]>([]);
  const [explanation, setExplanation] = useState<LiveWorkExplanation | null>(null);

  const loadAgent = useCallback(async () => {
    try {
      const data = await getAgent(agentId);
      setAgent(data);
      setNotFound(false);
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenta"));
      }
    }
  }, [agentId]);

  const loadFull = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAgent(agentId);
      setAgent(data);
      setNotFound(false);
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenta"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void loadFull();
  }, [loadFull]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadAgent();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadAgent]);

  const loadTabData = useCallback(
    async (t: string) => {
      if (!agentId) return;
      switch (t) {
        case "history":
          try {
            const [history, queue] = await Promise.all([
              getAgentTaskHistory(agentId),
              getAgentTaskQueue(agentId),
            ]);
            setTaskHistory(history);
            setTaskQueue(queue);
          } catch {
            /* ignore */
          }
          break;
        case "logs":
          try {
            const l = await getAgentLogs(agentId, 200);
            setLogs(l);
          } catch {
            /* ignore */
          }
          break;
        case "memory":
          try {
            const m = await getAgentMemory(agentId);
            setMemory(m);
          } catch {
            /* ignore */
          }
          break;
        case "metrics":
          try {
            const m = await getAgentMetrics(agentId, 50);
            setMetricsHistory(m);
          } catch {
            /* ignore */
          }
          break;
        case "overview":
          try {
            const exp = await getAgentExplanation(agentId);
            setExplanation(exp);
          } catch {
            /* ignore */
          }
          break;
      }
    },
    [agentId],
  );

  useEffect(() => {
    void loadTabData(tab);
  }, [tab, loadTabData]);

  const action = async (fn: (id: string) => Promise<void>, name: string) => {
    setActionLoading(name);
    try {
      await fn(agentId);
      await loadAgent();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Loading ----
  if (isLoading && !agent) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst agenta"
        description={error.message}
        action={
          <Button onClick={() => void loadFull()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Zkusit znovu
          </Button>
        }
      />
    );
  }

  // ---- 404 ----
  if (notFound) {
    return (
      <EmptyState
        variant="error"
        title="Agent nenalezen"
        description={`Agent s ID "${agentId}" neexistuje nebo byl smazán.`}
        action={
          <Button onClick={() => router.push("/agents")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Zpět na seznam agentů
          </Button>
        }
      />
    );
  }

  if (!agent) return <></>;

  const state = agent.state;
  const totalTasks = state.pendingTasks + state.runningTasks + state.completedTasks + state.failedTasks;
  const successRate =
    agent.metrics.totalTasks > 0
      ? Math.round((agent.metrics.successfulTasks / agent.metrics.totalTasks) * 100)
      : 0;
  const isRunning =
    state.status !== "offline" && state.status !== "error" && state.status !== "paused";

  const canStart = state.status === "offline" || state.status === "error";
  const canStop = state.status !== "offline" && state.status !== "error" && state.status !== "stopping";
  const canPause = state.status === "idle" || isOperationalStatus(state.status);
  const canResume = state.status === "paused";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" className="gap-2 -ml-3" onClick={() => router.push("/agents")}>
        <ArrowLeft className="h-4 w-4" />
        Zpět na agenty
      </Button>

      {/* Header */}
      <Card
        className="rounded-xl hud-card"
        style={{ borderLeftColor: hudBorderColor(state.status) }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-none bg-primary/10 text-primary">
                <Bot className="h-7 w-7" />
                <StatusDot status={state.status} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{agent.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs rounded-none font-mono uppercase">
                    {agent.role}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", statusColor(state.status))}>
                    {statusLabel(state.status)}
                  </Badge>
                  <HealthIndicator health={agent.health.status} />
                  <Badge variant="outline" className={cn("text-xs", priorityColor(agent.priority))}>
                    {priorityLabel(agent.priority)}
                  </Badge>
                </div>
                {agent.description && (
                  <p className="text-sm text-muted-foreground mt-2">{agent.description}</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              {canStart && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => void action(startAgent, "start")}
                  disabled={actionLoading === "start"}
                >
                  {actionLoading === "start" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start
                </Button>
              )}
              {canStop && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void action(stopAgent, "stop")}
                  disabled={actionLoading === "stop"}
                >
                  {actionLoading === "stop" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Stop
                </Button>
              )}
              {canPause && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void action(pauseAgent, "pause")}
                  disabled={actionLoading === "pause"}
                >
                  {actionLoading === "pause" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  Pause
                </Button>
              )}
              {canResume && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void action(resumeAgent, "resume")}
                  disabled={actionLoading === "resume"}
                >
                  {actionLoading === "resume" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Resume
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void action(restartAgent, "restart")}
                disabled={actionLoading === "restart"}
              >
                {actionLoading === "restart" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Restart
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Task progress + mini stats */}
      {isRunning && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Průběh úkolu</span>
            <span className="font-mono">{state.taskProgress}%</span>
          </div>
          <Progress value={state.taskProgress} className="h-2 rounded-none" />
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 text-center text-sm">
        <div className="rounded-lg border border-[var(--hud-border)] p-3 bg-card/50">
          <div className="font-mono font-bold text-lg">{state.pendingTasks}</div>
          <div className="text-xs text-muted-foreground">čeká</div>
        </div>
        <div className="rounded-lg border border-[var(--hud-border)] p-3 bg-card/50">
          <div className="font-mono font-bold text-lg">{state.runningTasks}</div>
          <div className="text-xs text-muted-foreground">běží</div>
        </div>
        <div className="rounded-lg border border-[var(--hud-border)] p-3 bg-card/50">
          <div className="font-mono font-bold text-lg">{state.completedTasks}</div>
          <div className="text-xs text-muted-foreground">hotovo</div>
        </div>
        <div className="rounded-lg border border-[var(--hud-border)] p-3 bg-card/50">
          <div className="font-mono font-bold text-lg">{state.failedTasks}</div>
          <div className="text-xs text-muted-foreground">chyba</div>
        </div>
      </div>

      {totalTasks > 0 && (
        <div className="space-y-1">
          <Progress value={(state.completedTasks / totalTasks) * 100} className="h-1.5 rounded-none" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Úspěšnost <span className="font-mono">{successRate}%</span>
            </span>
            <span className="font-mono">{agent.metrics.totalTasks} celkem</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Card className="rounded-xl">
        <Tabs value={tab} onValueChange={setTab}>
          <CardHeader className="pb-0">
            <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-[var(--hud-border)] h-auto p-0 gap-0 overflow-x-auto">
              {[
                { key: "overview", label: "Přehled", icon: Activity },
                { key: "history", label: "Úkoly", icon: ListTodo },
                { key: "config", label: "Konfigurace", icon: Settings2 },
                { key: "logs", label: "Logy", icon: Terminal },
                { key: "metrics", label: "Metriky", icon: BarChart3 },
                { key: "memory", label: "Paměť", icon: Brain },
              ].map(({ key, label, icon: Icon }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            {/* --- Přehled --- */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              {explanation ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <ExplanationField label="Aktuální aktivita" icon={Activity} highlight>
                    {explanation.currentActivity}
                  </ExplanationField>
                  <ExplanationField label="Cíl" icon={Gauge}>
                    {explanation.goal}
                  </ExplanationField>
                  <ExplanationField label="Důvod" icon={Zap}>
                    {explanation.reason}
                  </ExplanationField>
                  <ExplanationField label="Další krok" icon={Timer} highlight>
                    {explanation.nextStep}
                  </ExplanationField>
                  <ExplanationField label="Odhad dokončení" icon={Clock}>
                    {explanation.estimatedCompletion}
                  </ExplanationField>
                  <ExplanationField label="Sebedůvěra" icon={CheckCircle2}>
                    <ConfettiMini confidence={explanation.confidence} />
                  </ExplanationField>
                  <ExplanationField label="Použité nástroje" icon={Wrench}>
                    {explanation.toolsUsed.length > 0
                      ? explanation.toolsUsed.join(", ")
                      : "—"}
                  </ExplanationField>
                  <ExplanationField label="Rizika" icon={AlertTriangle}>
                    {explanation.risks || "—"}
                  </ExplanationField>
                  <ExplanationField label="Potřebuje od uživatele" icon={Brain}>
                    {explanation.needsFromUser || "—"}
                  </ExplanationField>
                  <ExplanationField label="Alternativní přístup" icon={ExternalLink}>
                    {explanation.alternativeApproach || "—"}
                  </ExplanationField>
                  {explanation.findings && (
                    <ExplanationField label="Zjištění" icon={FileText}>
                      {explanation.findings}
                    </ExplanationField>
                  )}
                  {explanation.lastCompletedStep && (
                    <ExplanationField label="Poslední dokončený krok" icon={CheckCircle2}>
                      {explanation.lastCompletedStep}
                    </ExplanationField>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Načítám live explanation...
                </div>
              )}

              {explanation && explanation.evidence.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Evidence</h4>
                    <ul className="space-y-1">
                      {explanation.evidence.map((e, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-[var(--hud-green)] mt-1">•</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {explanation && explanation.decisionLog.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Rozhodnutí</h4>
                    <div className="space-y-2">
                      {explanation.decisionLog.map((d, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-[var(--hud-border)] bg-card/50 p-3 text-sm flex gap-3"
                        >
                          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap shrink-0">
                            {d.timestamp}
                          </span>
                          <span>{d.thought}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Metriky</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard icon={ListTodo} label="Celkem úkolů" value={agent.metrics.totalTasks} />
                  <MetricCard icon={CheckCircle2} label="Úspěšných" value={agent.metrics.successfulTasks} />
                  <MetricCard icon={AlertTriangle} label="Chyb" value={agent.metrics.failedTasks} />
                  <MetricCard icon={RotateCcw} label="Retry" value={agent.metrics.retriedTasks} />
                  <MetricCard
                    icon={Timer}
                    label="Prům. doba"
                    value={formatDuration(agent.metrics.averageDurationMs)}
                  />
                  <MetricCard icon={AlertTriangle} label="Chyb celkem" value={agent.metrics.errorCount} />
                  <MetricCard
                    icon={Zap}
                    label="Tokeny"
                    value={agent.metrics.totalTokens ?? "—"}
                  />
                  <MetricCard
                    icon={Clock}
                    label="Aktualizace"
                    value={formatDate(agent.metrics.lastUpdatedAt)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* --- Úkoly --- */}
            <TabsContent value="history" className="mt-0 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historie úkolů
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {taskHistory.length} úkolů
                  </span>
                </div>
                {taskHistory.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Žádné dokončené úkoly
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taskHistory.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Fronta úkolů
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {taskQueue.length} úkolů
                  </span>
                </div>
                {taskQueue.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Fronta je prázdná
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taskQueue.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* --- Konfigurace --- */}
            <TabsContent value="config" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-[var(--hud-border)] p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Model</div>
                  <div className="text-sm font-mono font-semibold mt-1">{agent.config.model}</div>
                </div>
                <div className="rounded-lg border border-[var(--hud-border)] p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Teplota</div>
                  <div className="text-sm font-mono font-semibold mt-1">{agent.config.temperature}</div>
                </div>
                <div className="rounded-lg border border-[var(--hud-border)] p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Max tokenů</div>
                  <div className="text-sm font-mono font-semibold mt-1">
                    {agent.config.maxTokens ?? "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--hud-border)] p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Timeout</div>
                  <div className="text-sm font-mono font-semibold mt-1">
                    {formatDuration(agent.config.timeoutMs)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">System Prompt</h4>
                <div className="rounded-lg border border-[var(--hud-border)] bg-black/50 p-4 font-mono text-xs text-green-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {agent.config.systemPrompt}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Znalosti</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.config.knowledge.length > 0 ? (
                      agent.config.knowledge.map((k) => (
                        <Badge key={k} variant="outline" className="text-xs">
                          {k}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Nástroje</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.config.tools.length > 0 ? (
                      agent.config.tools.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Oprávnění</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-[var(--hud-border)] p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                      Čtení
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.config.permissions.canRead.length > 0 ? (
                        agent.config.permissions.canRead.map((r) => (
                          <Badge key={r} variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                            {r}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--hud-border)] p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                      Zápis
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.config.permissions.canWrite.length > 0 ? (
                        agent.config.permissions.canWrite.map((w) => (
                          <Badge key={w} variant="outline" className="text-xs border-amber-500/30 bg-amber-500/10 text-amber-500">
                            {w}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--hud-border)] p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                      Spuštění
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.config.permissions.canExecute.length > 0 ? (
                        agent.config.permissions.canExecute.map((x) => (
                          <Badge key={x} variant="outline" className="text-xs border-rose-500/30 bg-rose-500/10 text-rose-500">
                            {x}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Retry politika</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[var(--hud-border)] p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Max retry
                    </div>
                    <div className="text-sm font-mono font-semibold mt-1">
                      {agent.config.retryPolicy.maxRetries}x
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--hud-border)] p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Backoff
                    </div>
                    <div className="text-sm font-mono font-semibold mt-1">
                      {formatDuration(agent.config.retryPolicy.backoffMs)}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* --- Logy --- */}
            <TabsContent value="logs" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                  {logs.length} záznamů
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => void loadTabData("logs")}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Obnovit
                </Button>
              </div>
              {logs.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Žádné logy
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--hud-border)] bg-black/50 font-mono text-xs overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {logs.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex gap-3 px-4 py-1.5 border-b border-[var(--hud-border)]/40 hover:bg-white/[0.02]"
                      >
                        <span className="text-muted-foreground shrink-0">
                          {new Date(entry.timestamp).toLocaleTimeString("cs-CZ")}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 w-12 font-semibold uppercase",
                            logLevelColor(entry.level),
                          )}
                        >
                          {entry.level}
                        </span>
                        <span className="text-green-400/90 break-all">{entry.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* --- Metriky --- */}
            <TabsContent value="metrics" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  icon={ListTodo}
                  label="Celkem úkolů"
                  value={agent.metrics.totalTasks}
                />
                <MetricCard
                  icon={CheckCircle2}
                  label="Úspěšných"
                  value={agent.metrics.successfulTasks}
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="Neúspěšných"
                  value={agent.metrics.failedTasks}
                />
                <MetricCard
                  icon={RotateCcw}
                  label="Retry"
                  value={agent.metrics.retriedTasks}
                />
                <MetricCard
                  icon={Timer}
                  label="Průměrná doba"
                  value={formatDuration(agent.metrics.averageDurationMs)}
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="Chyb"
                  value={agent.metrics.errorCount}
                />
                <MetricCard
                  icon={Gauge}
                  label="Úspěšnost"
                  value={`${successRate}%`}
                  sub={
                    <div className="mt-1">
                      <Progress value={successRate} className="h-1 rounded-none" />
                    </div>
                  }
                />
                <MetricCard
                  icon={Zap}
                  label="Tokeny"
                  value={agent.metrics.totalTokens ?? "—"}
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Historie metrik</h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {metricsHistory.length} záznamů
                  </span>
                </div>
                {metricsHistory.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Žádná historie metrik
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--hud-border)] bg-black/50 font-mono text-xs overflow-hidden">
                    <div className="max-h-64 overflow-y-auto p-4">
                      <pre className="text-green-400/80 whitespace-pre-wrap">
                        {JSON.stringify(metricsHistory, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground text-right">
                Poslední aktualizace: {formatDate(agent.metrics.lastUpdatedAt)}
              </div>
            </TabsContent>

            {/* --- Paměť --- */}
            <TabsContent value="memory" className="mt-0">
              {memory.length === 0 && Object.keys(agent.memory).length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Paměť agenta je prázdná
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(agent.memory).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Agentská paměť</h4>
                      <div className="rounded-xl border border-[var(--hud-border)] bg-black/50 p-4 font-mono text-xs text-green-400 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(agent.memory, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {memory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Paměťové položky ({memory.length})
                      </h4>
                      <div className="rounded-xl border border-[var(--hud-border)] bg-black/50 p-4 font-mono text-xs text-green-400 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(memory, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
