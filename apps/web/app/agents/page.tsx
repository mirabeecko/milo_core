"use client";

import { useState } from "react";
import {
  BookOpen,
  Bot,
  Code,
  Play,
  Scale,
  Search,
  Sunrise,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { agents, agentLogs } from "@/lib/mocks";
import { formatRelative, getStatusColor, getStatusLabel } from "@/lib/format";
import type { Agent, AgentLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  sunrise: Sunrise,
  scale: Scale,
  search: Search,
  code: Code,
  "book-open": BookOpen,
  bot: Bot,
};

export default function AgentsPage(): JSX.Element {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
            <p className="text-muted-foreground">Moduly MiLO, každý se svým úkolem a pamětí.</p>
          </div>
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Spustit vše
          </Button>
        </div>

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
                {getFilteredLogs(selectedAgent?.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné logy k zobrazení.</p>
                ) : (
                  getFilteredLogs(selectedAgent?.id).map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AgentCard({
  agent,
  isSelected,
  onClick,
}: {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}): JSX.Element {
  const Icon = iconMap[agent.icon] ?? Bot;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-primary/50",
        isSelected && "border-primary ring-1 ring-primary",
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{agent.name}</h3>
              <Badge variant="outline" className={cn("text-xs", getStatusColor(agent.status))}>
                {getStatusLabel(agent.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{agent.role}</p>
            <p className="mt-2 text-sm">{agent.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Terminal className="h-3.5 w-3.5" />
                {agent.currentTask}
              </span>
              <span>Poslední aktivita: {formatRelative(agent.lastActive)}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0">
            Detail
          </Button>
        </div>
      </CardContent>
    </Card>
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
      <p className="mt-1 text-xs text-muted-foreground">{formatRelative(log.timestamp)}</p>
    </div>
  );
}

function getFilteredLogs(agentId?: string): AgentLogEntry[] {
  if (!agentId) return agentLogs.slice(0, 10);
  return agentLogs.filter((log) => log.agentId === agentId).slice(0, 10);
}
