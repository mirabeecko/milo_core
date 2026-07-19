"use client";

import { useEffect, useState, useCallback } from "react";
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
import { useSSE } from "@/lib/hooks/useSSE";
import type { SseEvent } from "@/lib/hooks/useSSE";
import type { Agent } from "@/lib/types";

const AGENT_EVENT_TYPES = [
  "agent:status",
  "agent:heartbeat",
  "agent:registered",
  "agent:error",
  "agent:task:created",
  "agent:task:started",
  "agent:task:completed",
  "agent:task:failed",
  "agent:task:cancelled",
];

function updateAgentFromEvent(
  agents: Agent[],
  event: SseEvent,
): Agent[] {
  const agentId = event.agentId ?? (event.payload?.agentId as string | undefined);
  if (!agentId) return agents;

  return agents.map((agent) => {
    if (agent.id !== agentId) return agent;

    switch (event.type) {
      case "agent:status":
        return {
          ...agent,
          status: (event.payload?.status as Agent["status"]) ?? agent.status,
          updatedAt: event.timestamp ?? agent.updatedAt,
        };
      case "agent:heartbeat":
        return {
          ...agent,
          status: (event.payload?.status as Agent["status"]) ?? agent.status,
          health: {
            ...agent.health,
            lastHeartbeat: event.timestamp ?? agent.health.lastHeartbeat,
            status: "healthy" as const,
          },
          updatedAt: event.timestamp ?? agent.updatedAt,
        };
      case "agent:task:created":
        return {
          ...agent,
          metrics: {
            ...agent.metrics,
            totalTasks: agent.metrics.totalTasks + 1,
          },
          updatedAt: event.timestamp ?? agent.updatedAt,
        };
      case "agent:task:started":
        return {
          ...agent,
          updatedAt: event.timestamp ?? agent.updatedAt,
        };
      case "agent:task:completed":
        return {
          ...agent,
          metrics: {
            ...agent.metrics,
            successfulTasks: agent.metrics.successfulTasks + 1,
          },
          updatedAt: event.timestamp ?? agent.updatedAt,
        };
      case "agent:task:failed":
      case "agent:task:cancelled":
        return {
          ...agent,
          updatedAt: event.timestamp ?? agent.updatedAt,
        };
      default:
        return agent;
    }
  });
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => void load(), [load]);

  const handleSseEvent = useCallback((event: SseEvent) => {
    if (AGENT_EVENT_TYPES.includes(event.type)) {
      setAgents((prev) => updateAgentFromEvent(prev, event));
    }
  }, []);

  useSSE(handleSseEvent);

  const action = async (agentId: string, fn: (id: string) => Promise<void>, actionName: string) => {
    const agent = agents.find((a) => a.id === agentId);
    const name = agent?.name ?? agentId;
    setActionLoading(actionName);
    try {
      await fn(agentId);
      // SSE will handle the state update, but also fetch once for consistency
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
