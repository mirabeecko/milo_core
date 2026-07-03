import Link from "next/link";
import {
  Bot,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
}

export function AgentCard({
  agent,
  isSelected,
  onClick,
  onStart,
  onStop,
  onPause,
  onResume,
  onRestart,
}: AgentCardProps): JSX.Element {
  const state = agent.state;
  const total = state.pendingTasks + state.runningTasks + state.completedTasks + state.failedTasks;
  const successRate = agent.metrics.totalTasks > 0
    ? Math.round((agent.metrics.successfulTasks / agent.metrics.totalTasks) * 100)
    : 0;
  const isRunning = state.status !== "offline" && state.status !== "error" && state.status !== "paused";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        isSelected && "border-primary ring-1 ring-primary",
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
              <StatusDot status={state.status} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{agent.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs", statusColor(state.status))}>
            {statusLabel(state.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>🧠 Co dělá</span>
            <span>{state.explanation.estimatedCompletion}</span>
          </div>
          <p className="text-sm leading-relaxed">{state.explanation.currentActivity}</p>
        </div>

        {isRunning && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Průběh úkolu</span>
              <span>{state.taskProgress}%</span>
            </div>
            <Progress value={state.taskProgress} className="h-1.5" />
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-md border p-2">
            <div className="font-semibold">{state.pendingTasks}</div>
            <div className="text-muted-foreground">čeká</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{state.runningTasks}</div>
            <div className="text-muted-foreground">běží</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{state.completedTasks}</div>
            <div className="text-muted-foreground">hotovo</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="font-semibold">{state.failedTasks}</div>
            <div className="text-muted-foreground">chyba</div>
          </div>
        </div>

        {total > 0 && (
          <div className="space-y-1">
            <Progress value={(state.completedTasks / total) * 100} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Úspěšnost {successRate}%</span>
              <span>{agent.metrics.totalTasks} celkem</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {state.status === "offline" || state.status === "error" ? (
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onStart?.(); }}>
              <Play className="h-3.5 w-3.5" /> Start
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onStop?.(); }}>
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
          )}
          {state.status === "paused" ? (
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onResume?.(); }}>
              <Play className="h-3.5 w-3.5" /> Resume
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onPause?.(); }}>
              <Pause className="h-3.5 w-3.5" /> Pause
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onRestart?.(); }}>
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
            <Link href={`/agents/${agent.id}`} onClick={(e) => e.stopPropagation()}>
              <Settings2 className="h-3.5 w-3.5" /> Detail
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: Agent["state"]["status"] }): JSX.Element {
  const color = statusDotColor(status);
  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background",
        color,
      )}
    />
  );
}

function statusDotColor(status: Agent["state"]["status"]): string {
  switch (status) {
    case "working":
    case "delegating":
    case "reviewing":
    case "reporting":
      return "bg-emerald-500";
    case "thinking":
    case "planning":
      return "bg-amber-500";
    case "idle":
      return "bg-blue-500";
    case "waiting":
      return "bg-cyan-500";
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

function statusColor(status: Agent["state"]["status"]): string {
  switch (status) {
    case "working":
    case "delegating":
    case "reviewing":
    case "reporting":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    case "thinking":
    case "planning":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "idle":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "waiting":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-500";
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

function statusLabel(status: Agent["state"]["status"]): string {
  switch (status) {
    case "thinking":
      return "Přemýšlí";
    case "planning":
      return "Plánuje";
    case "delegating":
      return "Deleguje";
    case "working":
      return "Pracuje";
    case "waiting":
      return "Čeká na vstup";
    case "reviewing":
      return "Kontroluje";
    case "reporting":
      return "Reportuje";
    case "idle":
      return "Čeká";
    case "paused":
      return "Pozastaveno";
    case "offline":
      return "Offline";
    case "error":
      return "Chyba";
    default:
      return status;
  }
}
