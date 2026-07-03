"use client";

import { useEffect, useState } from "react";
import { Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AgentCard } from "@/components/agent/agent-card";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { getAgents, getAgentLogs } from "@/lib/api/agents.api";
import { formatRelative } from "@/lib/format";
import type { Agent, AgentLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AgentsPage(): JSX.Element {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);
        const [agentsData, logsData] = await Promise.all([getAgents(), getAgentLogs()]);
        setAgents(agentsData);
        setLogs(logsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenty"));
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const filteredLogs = selectedAgent
    ? logs.filter((log) => log.agentId === selectedAgent.id).slice(0, 10)
    : logs.slice(0, 10);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <LoadingState rows={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
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
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Agents" description="Moduly MiLO, každý se svým úkolem a pamětí.">
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Spustit vše
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
              />
            ))}
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Log práce</CardTitle>
                <CardDescription>
                  {selectedAgent ? `Aktivita agenta ${selectedAgent.name}` : "Poslední záznamy"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné logy k zobrazení.</p>
                ) : (
                  filteredLogs.map((log) => <LogRow key={log.id} log={log} />)
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
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
            log.level === "warning" && "bg-amber-500",
            log.level === "error" && "bg-rose-500",
          )}
        />
        <span className="font-medium">{log.message}</span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Terminal className="h-3 w-3" />
        {formatRelative(log.timestamp)}
      </p>
    </div>
  );
}
