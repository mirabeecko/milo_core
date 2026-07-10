"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agent/agent-card";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import {
  getAgents,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
  restartAgent,
} from "@/lib/api/agents.api";
import {
  notifyAgentStarted,
  notifyAgentStopped,
  notifyAgentPaused,
  notifyAgentResumed,
  notifyAgentRestarted,
  notifyAgentError,
} from "@/lib/notifications";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenty"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => void load(), []);

  const action = async (agentId: string, fn: (id: string) => Promise<void>, actionName: string) => {
    const agent = agents.find((a) => a.id === agentId);
    const name = agent?.name ?? agentId;
    setActionLoading(actionName);
    try {
      await fn(agentId);
      await load();

      switch (actionName) {
        case "start":
          notifyAgentStarted(name);
          break;
        case "stop":
          notifyAgentStopped(name);
          break;
        case "pause":
          notifyAgentPaused(name);
          break;
        case "resume":
          notifyAgentResumed(name);
          break;
        case "restart":
          notifyAgentRestarted(name);
          break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Neznámá chyba";
      notifyAgentError(name, message);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst agenty"
        description={error.message}
        action={<Button onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Zkusit znovu</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Agenti" description="Agent Operating Center – správa a monitoring agentů">
        <Button onClick={() => void load()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Obnovit
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            actionLoading={actionLoading}
            onStart={() => void action(agent.id, startAgent, "start")}
            onStop={() => void action(agent.id, stopAgent, "stop")}
            onPause={() => void action(agent.id, pauseAgent, "pause")}
            onResume={() => void action(agent.id, resumeAgent, "resume")}
            onRestart={() => void action(agent.id, restartAgent, "restart")}
          />
        ))}
      </div>
    </div>
  );
}
