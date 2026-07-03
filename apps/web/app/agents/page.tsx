"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AgentCard } from "@/components/agent/agent-card";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import {
  getAgents,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
  restartAgent,
  getAgentLogs,
} from "@/lib/api/agents.api";
import { formatRelative } from "@/lib/format";
import type { Agent, AgentLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AgentsPage(): JSX.Element {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const agentsData = await getAgents();
      setAgents(agentsData);
      if (agentsData.length > 0) {
        setSelectedAgent((current) => current ?? agentsData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenty"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async (agentId: string): Promise<void> => {
    try {
      const logsData = await getAgentLogs(agentId, 20);
      setLogs(logsData);
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedAgentId = selectedAgent?.id;
  useEffect(() => {
    if (!selectedAgentId) return;
    void loadLogs(selectedAgentId);
  }, [selectedAgentId, loadLogs]);

  useEffect(() => {
    const eventSource = new EventSource("/api/events/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { agentId?: string; type?: string };
        if (data.agentId) {
          void load();
          if (selectedAgent?.id === data.agentId) {
            void loadLogs(data.agentId);
          }
        }
      } catch {
        // ignore malformed events
      }
    };
    return () => eventSource.close();
  }, [load, loadLogs, selectedAgent?.id]);

  async function handleAction(action: "start" | "stop" | "pause" | "resume" | "restart", id: string): Promise<void> {
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
          <LoadingState rows={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl">
          <EmptyState
            variant="error"
            title="Nepodařilo se načíst agenty"
            description={error.message}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Agent Operating Center" description="Živé řídicí centrum digitálních zaměstnanců.">
          <Button className="gap-2" onClick={() => void handleAction("start", "chief-of-staff")}>
            <Play className="h-4 w-4" />
            Spustit vše
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            Obnovit
          </Button>
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent?.id === agent.id}
                onClick={() => setSelectedAgent(agent)}
                onStart={() => void handleAction("start", agent.id)}
                onStop={() => void handleAction("stop", agent.id)}
                onPause={() => void handleAction("pause", agent.id)}
                onResume={() => void handleAction("resume", agent.id)}
                onRestart={() => void handleAction("restart", agent.id)}
              />
            ))}
          </div>

          <div className="space-y-4">
            {selectedAgent && <ExplanationCard agent={selectedAgent} />}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Log práce
                </CardTitle>
                <CardDescription>
                  {selectedAgent ? `Aktivita agenta ${selectedAgent.name}` : "Poslední záznamy"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné logy k zobrazení.</p>
                ) : (
                  logs.map((log) => <LogRow key={log.id} log={log} />)
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ExplanationCard({ agent }: { agent: Agent }): JSX.Element {
  const ex = agent.state.explanation;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Co právě dělá</CardTitle>
        <CardDescription>{agent.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ExplanationRow label="🧠 Aktivita" value={ex.currentActivity} />
        <ExplanationRow label="🎯 Cíl" value={ex.goal} />
        <ExplanationRow label="❓ Proč" value={ex.reason} />
        <ExplanationRow label="🔍 Zjištění" value={ex.findings} />
        <ExplanationRow label="➡ Další krok" value={ex.nextStep} />
        <ExplanationRow label="⚠ Rizika" value={ex.risks} />
        <ExplanationRow label="🙋 Potřebuje" value={ex.needsFromUser} />
        <ExplanationRow label="✅ Poslední krok" value={ex.lastCompletedStep} />
        {ex.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {ex.toolsUsed.map((tool) => (
              <span key={tool} className="rounded bg-muted px-2 py-0.5 text-xs">
                {tool}
              </span>
            ))}
          </div>
        )}
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

function LogRow({ log }: { log: AgentLogEntry }): JSX.Element {
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
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
  );
}
