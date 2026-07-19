"use client";

import { useEffect, useRef } from "react";
import {
  Bot,
  Brain,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Terminal,
  MessageSquare,
  Calendar,
  Search,
  BookOpen,
  Code2,
  Scale,
  FileText,
  Cog,
  Play,
  Pause,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/hooks/use-activity-stream";

// --- Agent icon map ---
const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "chief-of-staff": Bot,
  "calendar-agent": Calendar,
  "communication-agent": MessageSquare,
  "research-agent": Search,
  "knowledge-agent": BookOpen,
  "developer-agent": Code2,
  "legal-agent": Scale,
  "document-agent": FileText,
  "automation-agent": Cog,
  orchestrator: Terminal,
};

// --- Event icon & color ---
function eventStyle(type: ActivityEvent["type"]) {
  switch (type) {
    case "agent:started":
      return { icon: Play, color: "text-green-400", bg: "bg-green-500/10", label: "Start" };
    case "agent:thinking":
      return { icon: Brain, color: "text-amber-400", bg: "bg-amber-500/10", label: "Přemýšlí" };
    case "agent:tool_call":
      return { icon: Wrench, color: "text-blue-400", bg: "bg-blue-500/10", label: "Nástroj" };
    case "agent:tool_result":
      return { icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10", label: "Výsledek" };
    case "agent:completed":
      return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Hotovo" };
    case "agent:error":
      return { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Chyba" };
    case "hermes:tool_call":
      return { icon: Terminal, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Hermes" };
    case "hermes:tool_result":
      return { icon: Zap, color: "text-cyan-300", bg: "bg-cyan-500/10", label: "Hermes" };
    default:
      return { icon: Loader2, color: "text-muted-foreground", bg: "bg-muted", label: "" };
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// --- Activity Feed ---
interface ActivityFeedProps {
  events: ActivityEvent[];
  connected: boolean;
  onClear?: () => void;
  onReconnect?: () => void;
  maxHeight?: string;
}

export function ActivityFeed({ events, connected, onClear, onReconnect, maxHeight = "500px" }: ActivityFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="rounded-lg border border-[var(--hud-border)] bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--hud-border)] px-4 py-2">
        <div className="flex items-center gap-2">
          <Activity className={cn("h-4 w-4", connected ? "text-emerald-400" : "text-red-400")} />
          <span className="text-sm font-semibold font-mono">LIVE ACTIVITY</span>
          <Badge variant="outline" className={cn("text-xs", connected ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400")}>
            {connected ? "PŘIPOJENO" : "ODPOJENO"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {!connected && onReconnect && (
            <button onClick={onReconnect} className="p-1 hover:bg-muted rounded" title="Znovu připojit">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {onClear && (
            <button onClick={onClear} className="p-1 hover:bg-muted rounded" title="Vymazat">
              <span className="text-xs text-muted-foreground">Vymazat</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-8 w-8 animate-spin opacity-30" />
            <p className="text-sm">Čekám na aktivitu agentů...</p>
            <p className="text-xs opacity-50">
              {connected ? "SSE stream aktivní — spusť workflow" : "Připojuji se k activity serveru..."}
            </p>
          </div>
        ) : (
          <div className="relative pl-8 pr-4 py-2 space-y-1">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--hud-border)]" />

            {events.map((evt) => {
              const { icon: Icon, color, bg, label } = eventStyle(evt.type);
              const AgentIcon = agentIcons[evt.agentId] || Bot;

              return (
                <div key={evt.id} className="relative pb-2 group">
                  {/* Timeline dot */}
                  <div className={cn("absolute -left-4 top-1 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center", bg)}>
                    <Icon className={cn("h-2.5 w-2.5", color)} />
                  </div>

                  {/* Content */}
                  <div className="rounded border border-[var(--hud-border)] bg-card/30 p-2 hover:bg-card/60 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <AgentIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold">{evt.agentName}</span>
                      <Badge variant="outline" className={cn("text-[10px] px-1 py-0", color)}>
                        {label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                        {formatTime(evt.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{evt.message}</p>
                    {evt.toolName && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">
                        nástroj: {evt.toolName}
                      </p>
                    )}
                    {evt.error && (
                      <p className="text-xs text-red-400 mt-0.5">{evt.error}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
