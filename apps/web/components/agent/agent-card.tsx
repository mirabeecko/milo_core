"use client";

import Link from "next/link";
import { Bot, Zap, Wrench, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: Agent;
}

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  working: { label: "Pracuje", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", dot: "bg-emerald-500" },
  idle: { label: "Připraven", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", dot: "bg-blue-500" },
  thinking: { label: "Přemýšlí", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", dot: "bg-amber-500" },
  error: { label: "Chyba", color: "text-red-400 border-red-500/30 bg-red-500/10", dot: "bg-red-500" },
  offline: { label: "Offline", color: "text-zinc-500 border-zinc-600/30 bg-zinc-700/20", dot: "bg-zinc-600" },
  paused: { label: "Pozastaven", color: "text-slate-400 border-slate-500/30 bg-slate-500/10", dot: "bg-slate-500" },
};

export function AgentCard({ agent }: AgentCardProps): JSX.Element {
  const status = agent.state?.status ?? agent.status ?? "offline";
  const s = STATUS_MAP[status] ?? STATUS_MAP.offline;
  const hasTools = (agent.config?.tools?.length ?? 0) > 0;
  const tools = agent.config?.tools ?? [];
  const specializations = agent.specialization?.split(",").map((s: string) => s.trim()) ?? [];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        status === "offline" && "opacity-50 grayscale"
      )}
    >
      {/* Status bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          status === "working" ? "bg-emerald-500 animate-pulse" :
          status === "error" ? "bg-red-500" :
          status === "offline" ? "bg-zinc-700" :
          "bg-blue-500/50"
        )}
      />

      <CardContent className="p-4 pt-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              status === "working" ? "bg-emerald-500/20 text-emerald-400" :
              "bg-primary/10 text-primary"
            )}>
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <Link href={`/agents/${agent.id}`} className="font-semibold text-sm hover:text-primary transition-colors block truncate">
                {agent.name}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("inline-block h-1.5 w-1.5 rounded-full", s.dot)} />
                <span className={cn("text-[10px] font-medium", s.color.split(" ")[0])}>
                  {s.label}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", s.color)}>
            {s.label}
          </Badge>
        </div>

        {/* Účel */}
        {agent.specialization && (
          <div className="flex flex-wrap gap-1">
            {specializations.slice(0, 3).map((spec: string) => (
              <span key={spec} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Nástroje */}
        {hasTools && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
            {tools.slice(0, 4).map((t: string) => (
              <span key={t} className="text-[10px] text-muted-foreground/70 bg-muted/30 px-1 rounded font-mono">
                {t}
              </span>
            ))}
            {tools.length > 4 && (
              <span className="text-[10px] text-muted-foreground/50">+{tools.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {agent.health?.lastHeartbeat
                ? new Date(agent.health.lastHeartbeat).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </span>
          </div>
          <Link
            href={`/agents/${agent.id}`}
            className="text-[10px] text-primary/70 hover:text-primary transition-colors"
          >
            Detail →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
