"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Activity, Play, Pause, RefreshCw,
  Bot, ArrowRight, Terminal, X, AlertTriangle, AlertCircle,
  CheckCircle2, Info, ChevronRight, Radio, Gauge, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getAgents } from "@/lib/api/agents.api";
import type { Agent, AgentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WorkflowEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: "info" | "success" | "warning" | "error" | "task_start" | "task_complete" | "status_change";
  message: string;
}

interface PipelineNode {
  id: string;
  agentId?: string;
  label: string;
  isVirtual?: boolean;
  row: number;
  col: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type StatusCategory = "active" | "thinking" | "idle" | "paused" | "error" | "offline";

function categorizeStatus(status: AgentStatus): StatusCategory {
  switch (status) {
    case "working": case "delegating": case "reviewing": case "reporting":
    case "scheduling": case "implementing": case "testing": case "building":
    case "deploying":
      return "active";
    case "thinking": case "planning": case "analyzing": case "reading_code":
    case "starting": case "summarizing": case "drafting_reply":
    case "loading_calendar": case "loading_messages":
      return "thinking";
    case "idle": case "waiting":
      return "idle";
    case "paused":
      return "paused";
    case "error":
      return "error";
    case "offline": case "stopping": case "recovering":
      return "offline";
    default:
      return "offline";
  }
}

const statusCategoryConfig: Record<StatusCategory, { dot: string; badge: string; border: string; glow: string; label: string }> = {
  active:   { dot: "bg-emerald-500",    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/50",   glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",   label: "Pracuje" },
  thinking: { dot: "bg-amber-500",      badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",     border: "border-amber-500/50",     glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",  label: "Přemýšlí" },
  idle:     { dot: "bg-blue-500",       badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",       border: "border-blue-500/50",      glow: "",                                        label: "Nečinný" },
  paused:   { dot: "bg-slate-500",      badge: "border-slate-500/30 bg-slate-500/10 text-slate-400",    border: "border-slate-500/50",     glow: "",                                        label: "Pozastaven" },
  error:    { dot: "bg-rose-500",       badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",       border: "border-rose-500/50",      glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",   label: "Chyba" },
  offline:  { dot: "bg-zinc-700",       badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-500",       border: "border-zinc-500/50",      glow: "",                                        label: "Offline" },
};

function statusCategoryLabel(status: AgentStatus): string {
  switch (status) {
    case "thinking": return "Přemýšlí";
    case "planning": return "Plánuje";
    case "delegating": return "Deleguje";
    case "working": return "Pracuje";
    case "waiting": return "Čeká na vstup";
    case "reviewing": return "Kontroluje";
    case "reporting": return "Reportuje";
    case "loading_calendar": return "Načítá kalendář";
    case "loading_messages": return "Načítá zprávy";
    case "analyzing": return "Analyzuje";
    case "scheduling": return "Plánuje";
    case "summarizing": return "Shrnuje";
    case "drafting_reply": return "Píše odpověď";
    case "reading_code": return "Čte kód";
    case "implementing": return "Implementuje";
    case "testing": return "Testuje";
    case "building": return "Buildí";
    case "deploying": return "Deployuje";
    case "starting": return "Spouští se";
    case "stopping": return "Zastavuje se";
    case "recovering": return "Obnovuje se";
    case "idle": return "Čeká";
    case "paused": return "Pozastaveno";
    case "offline": return "Offline";
    case "error": return "Chyba";
    default: return status;
  }
}

const EVENT_ICONS: Record<WorkflowEvent["type"], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  task_start: Play,
  task_complete: CheckCircle2,
  status_change: Activity,
};

const EVENT_COLORS: Record<WorkflowEvent["type"], string> = {
  info: "border-l-blue-500 bg-blue-500/5",
  success: "border-l-emerald-500 bg-emerald-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  error: "border-l-rose-500 bg-rose-500/5",
  task_start: "border-l-cyan-500 bg-cyan-500/5",
  task_complete: "border-l-emerald-500 bg-emerald-500/5",
  status_change: "border-l-violet-500 bg-violet-500/5",
};

function formatEventTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ------------------------------------------------------------------ */
/*  Pipeline definition                                                */
/* ------------------------------------------------------------------ */

const PIPELINE_NODES: PipelineNode[] = [
  { id: "user-input",     label: "Uživatel",  isVirtual: true,                       row: 0, col: 0 },
  { id: "chief-of-staff", agentId: "chief-of-staff",     label: "Chief of Staff",     row: 0, col: 1 },
  { id: "research-agent", agentId: "research-agent",      label: "Research",          row: 0, col: 2 },
  { id: "knowledge-agent", agentId: "knowledge-agent",    label: "Knowledge",         row: 0, col: 3 },
  { id: "developer-agent", agentId: "developer-agent",    label: "Developer",         row: 1, col: 2 },
  { id: "document-agent",  agentId: "document-agent",     label: "Document",          row: 1, col: 3 },
  { id: "calendar-agent",  agentId: "calendar-agent",     label: "Calendar",          row: 2, col: 2 },
  { id: "communication-agent", agentId: "communication-agent", label: "Communication", row: 2, col: 3 },
  { id: "legal-agent",     agentId: "legal-agent",        label: "Legal",             row: 3, col: 2 },
  { id: "automation-agent", agentId: "automation-agent",  label: "Automation",        row: 4, col: 2 },
];

interface PipeEdge {
  from: string;
  to: string;
}

const PIPELINE_EDGES: PipeEdge[] = [
  { from: "user-input",          to: "chief-of-staff" },
  { from: "chief-of-staff",      to: "research-agent" },
  { from: "chief-of-staff",      to: "developer-agent" },
  { from: "chief-of-staff",      to: "calendar-agent" },
  { from: "chief-of-staff",      to: "legal-agent" },
  { from: "chief-of-staff",      to: "automation-agent" },
  { from: "research-agent",      to: "knowledge-agent" },
  { from: "developer-agent",     to: "document-agent" },
  { from: "calendar-agent",      to: "communication-agent" },
];

const COLS = 4;
const ROWS = 5;

/* ------------------------------------------------------------------ */
/*  Pipeline Section component                                         */
/* ------------------------------------------------------------------ */

function PipelineSection({ agents }: { agents: Agent[] }) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const getCategory = (node: PipelineNode): StatusCategory => {
    if (node.isVirtual) return "idle";
    const agent = agentMap.get(node.agentId!);
    return agent ? categorizeStatus(agent.state.status) : "offline";
  };

  /* Build a responsive grid: each cell is [row][col].
     The grid layout uses CSS Grid with column widths that create space for
     horizontal connectors between columns. */
  return (
    <div className="relative w-full overflow-x-auto pb-6">
      {/* Tailwind grid: 7 columns — 4 node columns + 3 connector columns */}
      <div
        className="grid min-w-[700px]"
        style={{
          gridTemplateColumns: "1fr 40px 1fr 40px 1fr 40px 1fr",
          gridTemplateRows: `repeat(${ROWS}, minmax(0, auto))`,
          gap: "0.5rem 0",
        }}
      >
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => {
            const node = PIPELINE_NODES.find((n) => n.row === row && n.col === col);
            const gridCol = col * 2 + 1; /* 1, 3, 5, 7 */
            const gridRow = row + 1;

            if (!node) {
              return (
                <div
                  key={`empty-${row}-${col}`}
                  style={{ gridColumn: gridCol, gridRow }}
                  className="min-h-[80px]"
                />
              );
            }

            const cat = getCategory(node);
            const cfg = statusCategoryConfig[cat];
            const agent = node.agentId ? agentMap.get(node.agentId) : undefined;
            const isActive = cat === "active" || cat === "thinking";
            const total = agent
              ? agent.state.pendingTasks + agent.state.runningTasks + agent.state.completedTasks + agent.state.failedTasks
              : 0;
            const progress = total > 0 ? Math.round((agent!.state.completedTasks / total) * 100) : 0;

            return (
              <div
                key={node.id}
                data-node-id={node.id}
                style={{ gridColumn: gridCol, gridRow }}
                className={cn(
                  "relative flex flex-col rounded-lg border-2 p-3 transition-all duration-500",
                  node.isVirtual
                    ? "border-dashed border-muted-foreground/20 bg-transparent"
                    : "cursor-pointer border-border bg-card/70 hover:border-primary/40",
                  node.isVirtual ? "" : cfg.border,
                  isActive && !node.isVirtual ? cfg.glow : "",
                  isActive && !node.isVirtual ? "animate-pulse-glow" : "",
                )}
              >
                {/* Status dot */}
                {!node.isVirtual && (
                  <span className={cn(
                    "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background",
                    cfg.dot,
                    isActive ? "animate-pulse" : "",
                  )} />
                )}

                {/* Label */}
                <div className="flex items-center gap-2">
                  {node.isVirtual ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md",
                      cat === "active" ? "bg-emerald-500/20 text-emerald-400" :
                      cat === "thinking" ? "bg-amber-500/20 text-amber-400" :
                      cat === "idle" ? "bg-blue-500/20 text-blue-400" :
                      cat === "error" ? "bg-rose-500/20 text-rose-400" :
                      "bg-zinc-700/20 text-zinc-500",
                    )}>
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <span className={cn(
                    "text-xs font-semibold",
                    node.isVirtual ? "text-muted-foreground" : "text-foreground",
                  )}>
                    {node.label}
                  </span>
                </div>

                {/* Progress bar for active agents */}
                {agent && !node.isVirtual && total > 0 && (
                  <div className="mt-2 space-y-0.5">
                    <Progress
                      value={agent.state.taskProgress}
                      className="h-1 rounded-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{statusCategoryLabel(agent.state.status)}</span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                  </div>
                )}

                {/* Mini stat row */}
                {agent && !node.isVirtual && (
                  <div className="mt-1.5 flex gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono text-emerald-400">{agent.state.completedTasks}</span>
                    <span className="text-muted-foreground/60">✓</span>
                    <span className="font-mono text-amber-400">{agent.state.runningTasks + agent.state.pendingTasks}</span>
                    <span className="text-muted-foreground/60">⏳</span>
                    {agent.state.failedTasks > 0 && (
                      <>
                        <span className="font-mono text-rose-400">{agent.state.failedTasks}</span>
                        <span className="text-muted-foreground/60">✗</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          }),
        )}

        {/* Connector cells between columns — 3 connector columns (cols 2, 4, 6 in the 7-col grid) */}
        {Array.from({ length: ROWS }).map((_, row) => {
          /* Which edges cross this row in this connector position? */
          const connPositions = [0, 1, 2]; /* connectors after col 0→1, 1→2, 2→3 */
          return connPositions.map((connIdx, ci) => {
            const fromCol = connIdx;
            const toCol = connIdx + 1;
            const gridCol = connIdx * 2 + 2; /* 2, 4, or 6 */
            const gridRow = row + 1;

            /* Find the source & target node in current row at these columns */
            const fromNode = PIPELINE_NODES.find((n) => n.row === row && n.col === fromCol);
            const toNode = PIPELINE_NODES.find((n) => n.row === row && n.col === toCol);

            /* Also handle "fall-through": chief-of-staff(row=0,col=1) connects to
               downstream agents on different rows (row=0,1,2,3,4 at col=2).
               These edges "cross" through connector at col=1→2 on lower rows. */
            const hasDirectEdge =
              fromNode && toNode &&
              PIPELINE_EDGES.some((e) => e.from === fromNode.id && e.to === toNode.id);

            /* Fan-out from chief-of-staff: if we are at the connector between col 1→2,
               and there is a toNode at col=2 that chief-of-staff connects to */
            const isFanOut = connIdx === 1 && toNode && toNode.col === 2 && toNode.agentId && !hasDirectEdge;
            const chiefNode = PIPELINE_NODES.find((n) => n.id === "chief-of-staff");
            const hasFanOutEdge =
              isFanOut && chiefNode && toNode &&
              PIPELINE_EDGES.some((e) => e.from === chiefNode.id && e.to === toNode.id);

            const showConnector = hasDirectEdge || hasFanOutEdge;

            if (!showConnector) {
              return (
                <div
                  key={`conn-${connIdx}-${row}`}
                  style={{ gridColumn: gridCol, gridRow }}
                  className="flex items-center justify-center"
                />
              );
            }

            /* Determine source/target agent status for color */
            const srcNode = hasDirectEdge ? fromNode : chiefNode;
            const dstNode = toNode;
            const srcCat = srcNode ? getCategory(srcNode) : "offline";
            const dstCat = dstNode ? getCategory(dstNode) : "offline";
            const srcCfg = statusCategoryConfig[srcCat];
            const dstCfg = statusCategoryConfig[dstCat];

            const isSrcActive = srcCat === "active" || srcCat === "thinking";
            const isDstActive = dstCat === "active" || dstCat === "thinking";

            const gradFrom = srcCfg.dot.replace("bg-", "from-");
            const gradTo = dstCfg.dot.replace("bg-", "to-");

            return (
              <div
                key={`conn-${connIdx}-${row}`}
                style={{ gridColumn: gridCol, gridRow }}
                className="flex items-center justify-center"
              >
                {showConnector && (
                  <div className="relative flex w-full items-center">
                    {/* Connection line */}
                    <div
                      className={cn(
                        "h-0.5 w-full rounded-full",
                        isSrcActive && isDstActive ? "bg-gradient-to-r" : "bg-border",
                        isSrcActive && isDstActive ? `${gradFrom} ${gradTo}` : "",
                      )}
                    />

                    {/* Flowing data dots */}
                    {(isSrcActive || isDstActive) && (
                      <>
                        <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-400 animate-flow-right opacity-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-400 animate-flow-right-delayed opacity-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <div className="absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-cyan-400 animate-flow-right-slow opacity-0 shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Agent detail panel                                                 */
/* ------------------------------------------------------------------ */

function AgentDetailPanel({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const state = agent.state;
  const total = state.pendingTasks + state.runningTasks + state.completedTasks + state.failedTasks;
  const cat = categorizeStatus(state.status);
  const cfg = statusCategoryConfig[cat];
  const metrics = agent.metrics;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg animate-slide-in-panel border-l border-border bg-card shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b p-4",
            cat === "active" ? "border-emerald-500/20 bg-emerald-500/5" :
            cat === "thinking" ? "border-amber-500/20 bg-amber-500/5" :
            cat === "error" ? "border-rose-500/20 bg-rose-500/5" :
            "border-border",
          )}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
                <span className={cn(
                  "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background",
                  cfg.dot,
                  (cat === "active" || cat === "thinking") ? "animate-pulse" : "",
                )} />
              </div>
              <div>
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-xs text-muted-foreground font-mono uppercase">{agent.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", cfg.badge)}>
                {statusCategoryLabel(state.status)}
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Explanation */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Aktuální aktivita</h4>
              <p className="text-sm">{state.explanation.currentActivity}</p>
              <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {state.explanation.goal && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-emerald-400">◆</span>
                    <span><strong>Cíl:</strong> {state.explanation.goal}</span>
                  </div>
                )}
                {state.explanation.reason && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-blue-400">◆</span>
                    <span><strong>Důvod:</strong> {state.explanation.reason}</span>
                  </div>
                )}
                {state.explanation.nextStep && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-amber-400">◆</span>
                    <span><strong>Další krok:</strong> {state.explanation.nextStep}</span>
                  </div>
                )}
                {state.explanation.findings && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-cyan-400">◆</span>
                    <span><strong>Zjištění:</strong> {state.explanation.findings}</span>
                  </div>
                )}
                {state.explanation.toolsUsed.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-purple-400">◆</span>
                    <span><strong>Nástroje:</strong> {state.explanation.toolsUsed.join(", ")}</span>
                  </div>
                )}
                {state.explanation.needsFromUser && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-rose-400">◆</span>
                    <span><strong>Potřebuje od uživatele:</strong> {state.explanation.needsFromUser}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Task progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Průběh úkolu</h4>
              <div className="flex items-center gap-3">
                <Progress value={state.taskProgress} className="h-2 flex-1" />
                <span className="text-sm font-mono text-muted-foreground">{state.taskProgress}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-md border border-border p-2">
                  <div className="font-mono font-semibold">{state.pendingTasks}</div>
                  <div className="text-muted-foreground">čeká</div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="font-mono font-semibold text-amber-400">{state.runningTasks}</div>
                  <div className="text-muted-foreground">běží</div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="font-mono font-semibold text-emerald-400">{state.completedTasks}</div>
                  <div className="text-muted-foreground">hotovo</div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="font-mono font-semibold text-rose-400">{state.failedTasks}</div>
                  <div className="text-muted-foreground">chyba</div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Metriky</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border p-2">
                  <div className="text-[10px] text-muted-foreground">Úspěšnost</div>
                  <div className="font-mono text-sm">
                    {metrics.totalTasks > 0
                      ? Math.round((metrics.successfulTasks / metrics.totalTasks) * 100)
                      : 0}%
                  </div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="text-[10px] text-muted-foreground">Celkem úkolů</div>
                  <div className="font-mono text-sm">{metrics.totalTasks}</div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="text-[10px] text-muted-foreground">Prům. doba</div>
                  <div className="font-mono text-sm">{(metrics.averageDurationMs / 1000).toFixed(1)}s</div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="text-[10px] text-muted-foreground">Chyb</div>
                  <div className={cn(
                    "font-mono text-sm",
                    metrics.errorCount > 0 ? "text-rose-400" : "text-emerald-400",
                  )}>
                    {metrics.errorCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Health */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Health</h4>
              <div className={cn(
                "flex items-center gap-2 rounded-md border p-2",
                agent.health.status === "healthy" ? "border-emerald-500/20 bg-emerald-500/5" :
                agent.health.status === "degraded" ? "border-amber-500/20 bg-amber-500/5" :
                "border-rose-500/20 bg-rose-500/5",
              )}>
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  agent.health.status === "healthy" ? "bg-emerald-500" :
                  agent.health.status === "degraded" ? "bg-amber-500" :
                  "bg-rose-500",
                )} />
                <span className="text-sm capitalize">{agent.health.status}</span>
                {agent.health.message && (
                  <span className="text-xs text-muted-foreground">— {agent.health.message}</span>
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Nástroje</h4>
              <div className="flex flex-wrap gap-1.5">
                {agent.config.tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="text-[10px] font-mono">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function WorkflowPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /* SSE event stream */
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [streamPaused, setStreamPaused] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(streamPaused);
  pausedRef.current = streamPaused;

  /* Agent detail */
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  /* --- Poll agents --- */
  const loadAgents = useCallback(async () => {
    try {
      const data = await getAgents();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenty"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
    const interval = setInterval(() => void loadAgents(), 2500);
    return () => clearInterval(interval);
  }, [loadAgents]);

  /* --- SSE connection --- */
  useEffect(() => {
    if (streamPaused) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setStreamConnected(false);
      return;
    }

    const es = new EventSource("/api/events/stream");
    eventSourceRef.current = es;

    es.onopen = () => setStreamConnected(true);

    es.onmessage = (evt) => {
      if (pausedRef.current) return;
      try {
        const parsed: WorkflowEvent = JSON.parse(evt.data);
        setEvents((prev) => {
          const next = [...prev, parsed];
          return next.length > 100 ? next.slice(next.length - 100) : next;
        });
      } catch {
        /* ignore malformed events */
      }
    };

    es.onerror = () => {
      setStreamConnected(false);
      es.close();
    };

    return () => {
      es.close();
      setStreamConnected(false);
    };
  }, [streamPaused]);

  /* --- Auto-scroll events --- */
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  /* --- Render loading --- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  /* --- Render error --- */
  if (error && agents.length === 0) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst agenty"
        description={error.message}
        action={
          <Button onClick={() => { setIsLoading(true); void loadAgents(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Zkusit znovu
          </Button>
        }
      />
    );
  }

  /* --- Stats --- */
  const activeCount = agents.filter((a) => categorizeStatus(a.state.status) === "active").length;
  const thinkingCount = agents.filter((a) => categorizeStatus(a.state.status) === "thinking").length;
  const errorCount = agents.filter((a) => categorizeStatus(a.state.status) === "error").length;
  const totalTasks = agents.reduce((sum, a) => sum + a.state.completedTasks, 0);

  /* --- Render --- */
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header with stats bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Live Workflow"
          description="Mission Control — přehled agentů a datových toků v reálném čase"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => { setIsLoading(true); void loadAgents(); }}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Obnovit
          </Button>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <Radio className="h-4 w-4 text-emerald-400" />
          <div>
            <div className="text-xs text-muted-foreground">Aktivní</div>
            <div className="font-mono text-lg font-semibold text-emerald-400">{activeCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <Activity className="h-4 w-4 text-amber-400" />
          <div>
            <div className="text-xs text-muted-foreground">Přemýšlí</div>
            <div className="font-mono text-lg font-semibold text-amber-400">{thinkingCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <Bot className="h-4 w-4 text-blue-400" />
          <div>
            <div className="text-xs text-muted-foreground">Celkem</div>
            <div className="font-mono text-lg font-semibold">{agents.length}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <div>
            <div className="text-xs text-muted-foreground">Splněno</div>
            <div className="font-mono text-lg font-semibold">{totalTasks}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <div>
            <div className="text-xs text-muted-foreground">Chyby</div>
            <div className={cn("font-mono text-lg font-semibold", errorCount > 0 ? "text-rose-400" : "")}>
              {errorCount}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <Gauge className="h-4 w-4 text-violet-400" />
          <div>
            <div className="text-xs text-muted-foreground">Stream</div>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "h-2 w-2 rounded-full",
                streamConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600",
              )} />
              <span className={cn(
                "font-mono text-sm",
                streamConnected ? "text-emerald-400" : "text-zinc-500",
              )}>
                {streamConnected ? "LIVE" : "OFF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Agent Status Grid */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Stav agentů
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => {
            const cat = categorizeStatus(agent.state.status);
            const cfg = statusCategoryConfig[cat];
            const isActive = cat === "active" || cat === "thinking";
            const total =
              agent.state.pendingTasks +
              agent.state.runningTasks +
              agent.state.completedTasks +
              agent.state.failedTasks;

            return (
              <Card
                key={agent.id}
                className={cn(
                  "cursor-pointer transition-all duration-500 hover:border-primary/40 hud-card group",
                  isActive ? cfg.glow : "",
                  isActive ? cfg.border : "",
                )}
                style={{ borderLeftColor: isActive ? undefined : undefined }}
                onClick={() => setSelectedAgent(agent)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          cat === "active" ? "bg-emerald-500/20 text-emerald-400" :
                          cat === "thinking" ? "bg-amber-500/20 text-amber-400" :
                          cat === "idle" ? "bg-blue-500/20 text-blue-400" :
                          cat === "error" ? "bg-rose-500/20 text-rose-400" :
                          "bg-zinc-700/20 text-zinc-500",
                        )}>
                          <Bot className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                          cfg.dot,
                          isActive ? "animate-pulse" : "",
                        )} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">{agent.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase truncate">
                          {agent.role}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px] px-1.5 py-0", cfg.badge)}>
                      {statusCategoryLabel(agent.state.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {agent.state.explanation.currentActivity || "—"}
                  </p>
                  {isActive && total > 0 && (
                    <div className="space-y-1">
                      <Progress
                        value={agent.state.taskProgress}
                        className="h-1 rounded-full group-hover:h-1.5 transition-all"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-mono">{agent.state.completedTasks}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span className="font-mono">{agent.state.runningTasks}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="font-mono">{agent.state.pendingTasks}</span>
                      </span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Section 2: Pipeline Visualization */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Datový pipeline
          </h3>
        </div>
        <Card className="overflow-hidden bg-card/60">
          <CardContent className="p-4 sm:p-6">
            <PipelineSection agents={agents} />
          </CardContent>
        </Card>
      </section>

      {/* Section 3: Live Event Stream */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Event stream
            </h3>
            {streamConnected && !streamPaused && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-mono">
              {events.length}/100
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setStreamPaused((p) => !p)}
          >
            {streamPaused ? (
              <>
                <Play className="h-3 w-3" /> Spustit
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" /> Pozastavit
              </>
            )}
          </Button>
        </div>

        <Card className="overflow-hidden border-zinc-800 bg-zinc-950/90">
          <CardContent className="p-0">
            {/* Terminal header */}
            <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 font-mono text-[10px] text-zinc-500">
                milo@workflow ~ event-stream
              </span>
            </div>

            {/* Event log */}
            <div className="h-80 overflow-y-auto font-mono text-xs leading-relaxed">
              {events.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-1 text-zinc-600">
                      <span className="animate-pulse">▌</span>
                      <span>Čekám na události...</span>
                    </div>
                    {!streamConnected && (
                      <p className="text-[10px] text-zinc-600">
                        Stream není připojen — {streamPaused ? "pozastaveno" : "připojuji..."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {events.map((evt, idx) => {
                const Icon = EVENT_ICONS[evt.type] ?? Info;
                const colorBorder = EVENT_COLORS[evt.type] ?? "border-l-zinc-600";
                const iconColor =
                  evt.type === "success" || evt.type === "task_complete" ? "text-emerald-400" :
                  evt.type === "warning" ? "text-amber-400" :
                  evt.type === "error" ? "text-rose-400" :
                  evt.type === "task_start" ? "text-cyan-400" :
                  evt.type === "status_change" ? "text-violet-400" :
                  "text-blue-400";

                return (
                  <div
                    key={evt.id || `${evt.timestamp}-${idx}`}
                    className={cn(
                      "border-l-2 px-3 py-1.5 animate-fade-in-up",
                      colorBorder,
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500 shrink-0">
                        {formatEventTime(evt.timestamp)}
                      </span>
                      <Icon className={cn("h-3 w-3 shrink-0", iconColor)} />
                      <span className={cn(
                        "font-semibold",
                        evt.type === "error" ? "text-rose-400" :
                        evt.type === "success" || evt.type === "task_complete" ? "text-emerald-400" :
                        evt.type === "warning" ? "text-amber-400" :
                        "text-zinc-300",
                      )}>
                        {evt.agentName}
                      </span>
                      <span className="text-zinc-600 text-[10px] uppercase">
                        {evt.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-zinc-400 pl-[5.5rem]">
                      {evt.message}
                    </p>
                  </div>
                );
              })}
              <div ref={eventsEndRef} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Agent detail overlay */}
      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
