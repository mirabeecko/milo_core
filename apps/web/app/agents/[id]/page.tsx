"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Activity, BookOpen, Cpu, Gauge, Settings, Terminal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import {
  getAgent,
  getAgentLogs,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
} from "@/lib/api/agents.api";
import type { Agent, AgentLogEntry } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AgentDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [agentData, logsData] = await Promise.all([
        getAgent(id),
        getAgentLogs(id, 50),
      ]);
      setAgent(agentData);
      setLogs(logsData);
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

  async function handleAction(action: "start" | "stop" | "pause" | "resume"): Promise<void> {
    if (action === "start") await startAgent(id);
    if (action === "stop") await stopAgent(id);
    if (action === "pause") await pauseAgent(id);
    if (action === "resume") await resumeAgent(id);
    await load();
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <LoadingState rows={6} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !agent) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <EmptyState
            variant="error"
            title="Nepodařilo se načíst agenta"
            description={error?.message ?? "Agent nebyl nalezen"}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title={agent.name} description={agent.description}>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
              Zpět
            </Link>
          </Button>
          {agent.state.status === "offline" || agent.state.status === "error" ? (
            <Button className="gap-2" onClick={() => void handleAction("start")}>
              <Activity className="h-4 w-4" /> Start
            </Button>
          ) : (
            <Button variant="destructive" className="gap-2" onClick={() => void handleAction("stop")}>
              <Terminal className="h-4 w-4" /> Stop
            </Button>
          )}
          {agent.state.status === "paused" ? (
            <Button variant="outline" className="gap-2" onClick={() => void handleAction("resume")}>
              <Activity className="h-4 w-4" /> Resume
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" onClick={() => void handleAction("pause")}>
              <Terminal className="h-4 w-4" /> Pause
            </Button>
          )}
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <OverviewCard agent={agent} />
            <ExplanationCard agent={agent} />
            <ToolsCard agent={agent} />
          </div>
          <div className="space-y-4">
            <MetricsCard agent={agent} />
            <LogsCard logs={logs} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function OverviewCard({ agent }: { agent: Agent }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Přehled
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
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
          <div className="font-medium">{agent.config.model}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Priorita</div>
          <Badge variant="outline">{agent.priority}</Badge>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Stav</div>
          <Badge variant="outline">{agent.state.status}</Badge>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Health</div>
          <div className="font-medium">{agent.health.status}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExplanationCard({ agent }: { agent: Agent }): JSX.Element {
  const ex = agent.state.explanation;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Vysvětlení práce
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ExplanationRow label="🧠 Co dělá" value={ex.currentActivity} />
        <ExplanationRow label="🎯 Cíl" value={ex.goal} />
        <ExplanationRow label="❓ Proč" value={ex.reason} />
        <ExplanationRow label="🔍 Zjištění" value={ex.findings} />
        <ExplanationRow label="➡ Další krok" value={ex.nextStep} />
        <ExplanationRow label="⚠ Rizika" value={ex.risks} />
        <ExplanationRow label="🙋 Potřebuje" value={ex.needsFromUser} />
        <ExplanationRow label="✅ Poslední krok" value={ex.lastCompletedStep} />
      </CardContent>
    </Card>
  );
}

function ExplanationRow({ label, value }: { label: string; value: string }): JSX.Element | null {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="leading-relaxed">{value}</p>
    </div>
  );
}

function ToolsCard({ agent }: { agent: Agent }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Nástroje a oprávnění
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Nástroje</div>
          <div className="flex flex-wrap gap-1">
            {agent.config.tools.map((tool) => (
              <Badge key={tool} variant="secondary">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Čtení</div>
            {agent.config.permissions.canRead.join(", ") || "—"}
          </div>
          <div>
            <div className="text-muted-foreground">Zápis</div>
            {agent.config.permissions.canWrite.join(", ") || "—"}
          </div>
          <div>
            <div className="text-muted-foreground">Exec</div>
            {agent.config.permissions.canExecute.join(", ") || "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricsCard({ agent }: { agent: Agent }): JSX.Element {
  const m = agent.metrics;
  const total = m.totalTasks || 1;
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
            <span>{Math.round((m.successfulTasks / total) * 100)}%</span>
          </div>
          <Progress value={(m.successfulTasks / total) * 100} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-md border p-2">
            <div className="font-semibold">{m.totalTasks}</div>
            <div className="text-muted-foreground">celkem</div>
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
            <div className="font-semibold">{Math.round(m.averageDurationMs / 1000)}s</div>
            <div className="text-muted-foreground">průměr</div>
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
          Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
