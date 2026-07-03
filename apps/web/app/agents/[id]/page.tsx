"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  BookOpen,
  Cpu,
  Gauge,
  Settings,
  Terminal,
  RotateCcw,
  Pause,
  Play,
  Square,
  ListTodo,
  History,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { CalendarAgentDetail } from "@/components/agent/calendar-agent-detail";
import {
  getAgent,
  getAgentLogs,
  getAgentTaskHistory,
  getAgentTaskQueue,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
  restartAgent,
} from "@/lib/api/agents.api";
import type { Agent, AgentLogEntry, AgentTask } from "@/lib/types";
import { formatDuration, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AgentDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [history, setHistory] = useState<AgentTask[]>([]);
  const [queue, setQueue] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [agentData, logsData, historyData, queueData] = await Promise.all([
        getAgent(id),
        getAgentLogs(id, 50),
        getAgentTaskHistory(id),
        getAgentTaskQueue(id),
      ]);
      setAgent(agentData);
      setLogs(logsData);
      setHistory(historyData);
      setQueue(queueData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenta"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const eventSource = new EventSource("/api/events/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { agentId?: string };
        if (data.agentId === id) {
          void load();
        }
      } catch {
        // ignore
      }
    };
    return () => eventSource.close();
  }, [id, load]);

  async function handleAction(action: "start" | "stop" | "pause" | "resume" | "restart"): Promise<void> {
    if (action === "start") await startAgent(id);
    if (action === "stop") await stopAgent(id);
    if (action === "pause") await pauseAgent(id);
    if (action === "resume") await resumeAgent(id);
    if (action === "restart") await restartAgent(id);
    await load();
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl">
          <LoadingState rows={6} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !agent) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl">
          <EmptyState
            variant="error"
            title="Nepodařilo se načíst agenta"
            description={error?.message ?? "Agent nebyl nalezen"}
          />
        </div>
      </DashboardLayout>
    );
  }

  const isRunning = agent.state.status !== "offline" && agent.state.status !== "error" && agent.state.status !== "paused";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title={agent.name} description={agent.description}>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
              Zpět
            </Link>
          </Button>
          {agent.state.status === "offline" || agent.state.status === "error" ? (
            <Button className="gap-2" onClick={() => void handleAction("start")}>
              <Play className="h-4 w-4" /> Start
            </Button>
          ) : (
            <Button variant="destructive" className="gap-2" onClick={() => void handleAction("stop")}>
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}
          {agent.state.status === "paused" ? (
            <Button variant="outline" className="gap-2" onClick={() => void handleAction("resume")}>
              <Play className="h-4 w-4" /> Resume
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" onClick={() => void handleAction("pause")}>
              <Pause className="h-4 w-4" /> Pause
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => void handleAction("restart")}>
            <RotateCcw className="h-4 w-4" /> Restart
          </Button>
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {agent.id === "calendar" ? (
              <CalendarAgentDetail agent={agent} />
            ) : (
              <>
                <LiveOverviewCard agent={agent} />
                <ActiveTaskCard agent={agent} />
                <Tabs defaultValue="queue" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="queue" className="gap-2">
                      <ListTodo className="h-4 w-4" /> Fronta
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="h-4 w-4" /> Historie
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                      <Settings className="h-4 w-4" /> Nastavení
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="queue">
                    <QueueCard queue={queue} />
                  </TabsContent>
                  <TabsContent value="history">
                    <HistoryCard history={history} />
                  </TabsContent>
                  <TabsContent value="settings">
                    <SettingsCard agent={agent} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>

          <div className="space-y-6">
            <StatusCard agent={agent} />
            <StatisticsCard agent={agent} />
            <LogsCard logs={logs} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LiveOverviewCard({ agent }: { agent: Agent }): JSX.Element {
  const ex = agent.state.explanation;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Live Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ExplanationRow label="🧠 Co právě dělám" value={ex.currentActivity} />
        <ExplanationRow label="🎯 Cíl" value={ex.goal} />
        <ExplanationRow label="❓ Proč to dělám" value={ex.reason} />
        <ExplanationRow label="🔍 Co jsem zatím zjistil" value={ex.findings} />
        <ExplanationRow label="📂 Jaké důkazy používám" value={ex.evidence.join(", ") || undefined} />
        <ExplanationRow label="🔧 Jaké nástroje používám" value={ex.toolsUsed.join(", ") || undefined} />
        <ExplanationRow label="➡ Další krok" value={ex.nextStep} />
        <ExplanationRow label="⏳ Odhad dokončení" value={ex.estimatedCompletion} />
        <ExplanationRow label="⚠ Rizika" value={ex.risks} />
        <ExplanationRow label="🙋 Co potřebuji od uživatele" value={ex.needsFromUser} />
        <ExplanationRow label="✅ Poslední dokončený krok" value={ex.lastCompletedStep} />
        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">⭐ Míra jistoty</div>
            <div className="font-medium">{ex.confidence}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">🔀 Alternativní postup</div>
            <div className="font-medium">{ex.alternativeApproach}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveTaskCard({ agent }: { agent: Agent }): JSX.Element {
  const state = agent.state;
  const isActive = state.status !== "idle" && state.status !== "offline" && state.status !== "error";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Aktivní úkol
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive ? (
          <p className="text-sm text-muted-foreground">Momentálně žádný aktivní úkol.</p>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{state.activeTaskId ? `Úkol #${state.activeTaskId}` : "Interní úkol"}</span>
                <Badge variant="outline" className={statusColor(agent.state.status)}>{statusLabel(agent.state.status)}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Postup</span>
                <span>{state.taskProgress}%</span>
              </div>
              <Progress value={state.taskProgress} className="h-2" />
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Stav</div>
                <div className="font-medium">{statusLabel(state.status)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Běží</div>
                <div className="font-medium">{formatDuration(state.runningTimeMs)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Poslední aktivita</div>
                <div className="font-medium">{state.lastActivityAt ? formatRelative(state.lastActivityAt) : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Odhad</div>
                <div className="font-medium">{state.explanation.estimatedCompletion}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QueueCard({ queue }: { queue: AgentTask[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          Fronta úkolů
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ve frontě nejsou žádné úkoly.</p>
        ) : (
          queue.map((task) => (
            <div key={task.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{task.title}</span>
                <Badge variant="outline" className={priorityColor(task.priority)}>{priorityLabel(task.priority)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function HistoryCard({ history }: { history: AgentTask[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Historie úkolů
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádná dokončená úloha.</p>
        ) : (
          history.map((task) => (
            <div key={task.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{task.title}</span>
                <Badge variant="outline" className={statusColor(task.status)}>{statusLabel(task.status)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {task.completedAt ? `Dokončeno ${formatRelative(task.completedAt)}` : `Vytvořeno ${formatRelative(task.createdAt)}`}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SettingsCard({ agent }: { agent: Agent }): JSX.Element {
  const cfg = agent.config;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Nastavení
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Role</div>
            <div className="font-medium">{agent.role}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Specializace</div>
            <div className="font-medium">{agent.specialization}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Model</div>
            <div className="font-medium">{cfg.model}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Teplota</div>
            <div className="font-medium">{cfg.temperature}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Max tokenů</div>
            <div className="font-medium">{cfg.maxTokens ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Timeout</div>
            <div className="font-medium">{formatDuration(cfg.timeoutMs)}</div>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">System prompt</div>
          <div className="rounded-md border bg-muted/50 p-3 text-xs leading-relaxed">{cfg.systemPrompt}</div>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Povolené nástroje</div>
          <div className="flex flex-wrap gap-1">
            {cfg.tools.map((tool) => (
              <Badge key={tool} variant="secondary">{tool}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCard({ agent }: { agent: Agent }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Stav
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant="outline" className={statusColor(agent.state.status)}>{statusLabel(agent.state.status)}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Health</span>
          <Badge variant="outline" className={healthColor(agent.health.status)}>{agent.health.status}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Běží</span>
          <span className="font-medium">{formatDuration(agent.state.runningTimeMs)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Poslední aktivita</span>
          <span className="font-medium">{agent.state.lastActivityAt ? formatRelative(agent.state.lastActivityAt) : "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Aktivní úkol</span>
          <span className="font-medium">{agent.state.activeTaskId ?? "—"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatisticsCard({ agent }: { agent: Agent }): JSX.Element {
  const m = agent.metrics;
  const total = m.totalTasks || 1;
  const successRate = Math.round((m.successfulTasks / total) * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Statistiky
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Úspěšnost</span>
            <span>{successRate}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-md border p-2">
            <div className="font-semibold">{m.totalTasks}</div>
            <div className="text-muted-foreground">celkem</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{m.successfulTasks}</div>
            <div className="text-muted-foreground">úspěch</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{m.failedTasks}</div>
            <div className="text-muted-foreground">chyby</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{m.retriedTasks}</div>
            <div className="text-muted-foreground">retry</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{formatDuration(m.averageDurationMs)}</div>
            <div className="text-muted-foreground">průměr</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{agent.state.completedTasks}</div>
            <div className="text-muted-foreground">dokončeno</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LogsCard({ logs }: { logs: AgentLogEntry[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Live Log
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] space-y-3 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné logy.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    log.level === "info" && "bg-blue-500",
                    log.level === "warn" && "bg-amber-500",
                    log.level === "error" && "bg-rose-500",
                    log.level === "debug" && "bg-slate-500",
                  )}
                />
                <span className="font-medium">{log.message}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatRelative(log.timestamp)}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ExplanationRow({ label, value }: { label: string; value?: string }): JSX.Element | null {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="whitespace-pre-line leading-relaxed">{value}</p>
    </div>
  );
}

function statusLabel(status: Agent["state"]["status"] | AgentTask["status"]): string {
  switch (status) {
    case "thinking":
      return "Přemýšlí";
    case "planning":
      return "Plánuje";
    case "delegating":
      return "Deleguje";
    case "working":
    case "running":
      return "Pracuje";
    case "waiting":
      return "Čeká na vstup";
    case "reviewing":
      return "Kontroluje";
    case "reporting":
      return "Reportuje";
    case "loading_calendar":
      return "Načítá kalendář";
    case "analyzing":
      return "Analyzuje";
    case "scheduling":
      return "Plánuje";
    case "idle":
      return "Čeká";
    case "paused":
      return "Pozastaveno";
    case "offline":
      return "Offline";
    case "error":
    case "failed":
      return "Chyba";
    case "completed":
      return "Dokončeno";
    case "pending":
      return "Čeká";
    case "cancelled":
      return "Zrušeno";
    default:
      return status;
  }
}

function statusColor(status: Agent["state"]["status"] | AgentTask["status"]): string {
  switch (status) {
    case "working":
    case "delegating":
    case "reviewing":
    case "reporting":
    case "scheduling":
    case "running":
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    case "thinking":
    case "planning":
    case "analyzing":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "idle":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "waiting":
    case "pending":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-500";
    case "loading_calendar":
      return "border-purple-500/30 bg-purple-500/10 text-purple-500";
    case "paused":
      return "border-slate-500/30 bg-slate-500/10 text-slate-500";
    case "offline":
      return "border-slate-700/30 bg-slate-700/10 text-slate-400";
    case "error":
    case "failed":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "cancelled":
      return "border-slate-500/30 bg-slate-500/10 text-slate-500";
    default:
      return "border-border";
  }
}

function priorityLabel(priority: AgentTask["priority"]): string {
  switch (priority) {
    case "critical":
      return "Kritická";
    case "high":
      return "Vysoká";
    case "normal":
      return "Normální";
    case "low":
      return "Nízká";
    default:
      return priority;
  }
}

function priorityColor(priority: AgentTask["priority"]): string {
  switch (priority) {
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

function healthColor(status: Agent["health"]["status"]): string {
  switch (status) {
    case "healthy":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    case "degraded":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "unhealthy":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    default:
      return "border-border";
  }
}
