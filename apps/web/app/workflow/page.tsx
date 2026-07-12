"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Activity, Play, Pause, RefreshCw,
  Bot, ArrowRight, Terminal, X, AlertTriangle, AlertCircle,
  CheckCircle2, Info, ChevronRight, Radio, Gauge, Cpu, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types (Control Center format)                                      */
/* ------------------------------------------------------------------ */

interface ControlAgent {
  id: string;
  slug: string;
  name: string;
  description: string;
  purpose: string;
  category: string;
  owner: string;
  status: string;
  lifecycle_status: string;
  risk_level: string;
  priority: string;
  implementation_progress: number;
  runtime_status: string;
  scope?: {
    allowed_extensions?: string[];
    restricted?: string[];
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

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
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

function controlAgentStatusLabel(agent: ControlAgent): string {
  const p = agent.implementation_progress;
  if (p >= 100) return "Hotovo";
  if (p >= 60) return "Implementuje se";
  if (p >= 30) return "Ve vývoji";
  if (p > 0) return "Zahájeno";
  return "Specifikováno";
}

function progressToCategory(p: number): "active" | "thinking" | "idle" | "error" | "offline" {
  if (p >= 100) return "active";
  if (p >= 60) return "thinking";
  if (p >= 30) return "idle";
  return "offline";
}

const statusCategoryConfig: Record<string, { dot: string; badge: string; border: string; glow: string; label: string }> = {
  active:   { dot: "bg-emerald-500",    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/50",   glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",   label: "Hotovo" },
  thinking: { dot: "bg-amber-500",      badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",     border: "border-amber-500/50",     glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",  label: "Ve vývoji" },
  idle:     { dot: "bg-blue-500",       badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",       border: "border-blue-500/50",      glow: "",                                        label: "Zahájeno" },
  error:    { dot: "bg-rose-500",       badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",       border: "border-rose-500/50",      glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",   label: "Chyba" },
  offline:  { dot: "bg-zinc-700",       badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-500",       border: "border-zinc-500/50",      glow: "",                                        label: "Specifikováno" },
};

/* ------------------------------------------------------------------ */
/*  Category icons                                                     */
/* ------------------------------------------------------------------ */

function categoryIcon(category: string) {
  switch (category) {
    case "executive": return Bot;
    case "design": return Palette;
    default: return Cpu;
  }
}

function categoryLabel(category: string): string {
  switch (category) {
    case "executive": return "Výkonný";
    case "design": return "Design";
    default: return category;
  }
}

/* ------------------------------------------------------------------ */
/*  Event stream helpers                                               */
/* ------------------------------------------------------------------ */

const EVENT_ICONS: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  task_start: Play,
  task_complete: CheckCircle2,
  status_change: Activity,
};

const EVENT_COLORS: Record<string, string> = {
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
/*  Dynamic pipeline builder                                           */
/* ------------------------------------------------------------------ */

function buildPipeline(agents: ControlAgent[]): { nodes: PipelineNode[]; edges: { from: string; to: string }[] } {
  const orchestrator = agents.find((a) => a.slug === "chief-orchestrator");
  const executives = agents.filter((a) => a.category === "executive" && a.slug !== "chief-orchestrator");
  const designers = agents.filter((a) => a.category === "design");

  const nodes: PipelineNode[] = [
    { id: "owner", label: "Vlastník", isVirtual: true, row: 0, col: 0 },
  ];

  const edges: { from: string; to: string }[] = [];

  // Orchestrator at col 1, row 0
  if (orchestrator) {
    nodes.push({ id: orchestrator.id, agentId: orchestrator.id, label: orchestrator.name, row: 0, col: 1 });
    edges.push({ from: "owner", to: orchestrator.id });
  }

  // Executive agents in col 2, rows 0..N
  executives.forEach((agent, i) => {
    nodes.push({ id: agent.id, agentId: agent.id, label: agent.name, row: i, col: 2 });
    if (orchestrator) edges.push({ from: orchestrator.id, to: agent.id });
  });

  // Design agents in col 3, rows 0..N (pod Chief Engineer)
  const engineer = executives.find((a) => a.slug === "chief-engineer");
  designers.forEach((agent, i) => {
    nodes.push({ id: agent.id, agentId: agent.id, label: agent.name, row: i, col: 3 });
    if (engineer) edges.push({ from: engineer.id, to: agent.id });
  });

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  Pipeline Section component                                         */
/* ------------------------------------------------------------------ */

function PipelineSection({ agents }: { agents: ControlAgent[] }) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const { nodes, edges } = buildPipeline(agents);

  const getCategory = (node: PipelineNode): string => {
    if (node.isVirtual) return "idle";
    const agent = agentMap.get(node.agentId!);
    return agent ? progressToCategory(agent.implementation_progress) : "offline";
  };

  const maxCol = Math.max(...nodes.map((n) => n.col), 0);
  const maxRow = Math.max(...nodes.map((n) => n.row), 0);
  const cols = maxCol + 1;
  const rows = maxRow + 1;

  const totalGridCols = cols * 2 - 1;

  return (
    <div className="relative w-full overflow-x-auto pb-6">
      <div
        className="grid min-w-[600px]"
        style={{
          gridTemplateColumns: Array.from({ length: cols }, () => "1fr").join(" ") + " " + Array.from({ length: cols - 1 }, () => "40px").join(" "),
          gridTemplateRows: `repeat(${rows}, minmax(0, auto))`,
          gap: "0.5rem 0",
        }}
      >
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => {
            const node = nodes.find((n) => n.row === row && n.col === col);
            const gridCol = col * 2 + 1;
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
            const progress = agent?.implementation_progress ?? 0;

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
                  ) : agent ? (
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md",
                      cat === "active" ? "bg-emerald-500/20 text-emerald-400" :
                      cat === "thinking" ? "bg-amber-500/20 text-amber-400" :
                      cat === "idle" ? "bg-blue-500/20 text-blue-400" :
                      cat === "error" ? "bg-rose-500/20 text-rose-400" :
                      "bg-zinc-700/20 text-zinc-500",
                    )}>
                      {React.createElement(categoryIcon(agent.category), { className: "h-3.5 w-3.5" })}
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-700/20 text-zinc-500">
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

                {/* Progress bar */}
                {agent && !node.isVirtual && (
                  <div className="mt-2 space-y-0.5">
                    <Progress
                      value={progress}
                      className="h-1 rounded-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{controlAgentStatusLabel(agent)}</span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                  </div>
                )}

                {/* Category badge */}
                {agent && !node.isVirtual && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      {categoryLabel(agent.category)}
                    </Badge>
                    <span className="font-mono">{agent.status.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
            );
          }),
        )}

        {/* Connectors */}
        {Array.from({ length: rows }).map((_, row) => {
          const connPositions = Array.from({ length: cols - 1 }, (_, i) => i);
          return connPositions.map((connIdx) => {
            const fromCol = connIdx;
            const toCol = connIdx + 1;
            const gridCol = connIdx * 2 + 2;
            const gridRow = row + 1;

            const fromNode = nodes.find((n) => n.row === row && n.col === fromCol);
            const toNode = nodes.find((n) => n.row === row && n.col === toCol);

            const hasDirectEdge =
              fromNode && toNode &&
              edges.some((e) => e.from === fromNode.id && e.to === toNode.id);

            // Fan-out: from col 1 (orchestrator row 0) to col 2 agents on different rows
            const orchestrator = nodes.find((n) => n.id === "chief-orchestrator" || n.agentId && agentMap.get(n.agentId)?.slug === "chief-orchestrator");
            const isFanOut = connIdx === 1 && toNode && toNode.col === 2 && toNode.agentId && !hasDirectEdge;
            const hasFanOutEdge = isFanOut && orchestrator &&
              edges.some((e) => e.from === orchestrator.id && e.to === toNode.id);

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

            const srcNode = hasDirectEdge ? fromNode : orchestrator;
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
                <div className="relative flex w-full items-center">
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full",
                      isSrcActive && isDstActive ? "bg-gradient-to-r" : "bg-border",
                      isSrcActive && isDstActive ? `${gradFrom} ${gradTo}` : "",
                    )}
                  />
                  {(isSrcActive || isDstActive) && (
                    <>
                      <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-400 animate-flow-right opacity-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-400 animate-flow-right-delayed opacity-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      <div className="absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-cyan-400 animate-flow-right-slow opacity-0 shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
                    </>
                  )}
                </div>
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
  agent: ControlAgent;
  onClose: () => void;
}) {
  const p = agent.implementation_progress;
  const cat = progressToCategory(p);
  const cfg = statusCategoryConfig[cat];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />
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
                {React.createElement(categoryIcon(agent.category), { className: "h-5 w-5" })}
                <span className={cn(
                  "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background",
                  cfg.dot,
                  (cat === "active" || cat === "thinking") ? "animate-pulse" : "",
                )} />
              </div>
              <div>
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-xs text-muted-foreground font-mono uppercase">{agent.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", cfg.badge)}>
                {controlAgentStatusLabel(agent)}
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Description */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Popis</h4>
              <p className="text-sm">{agent.description}</p>
            </div>

            {/* Purpose */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Účel</h4>
              <p className="text-sm font-medium">{agent.purpose}</p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Implementace</h4>
              <div className="flex items-center gap-3">
                <Progress value={p} className="h-2 flex-1" />
                <span className="text-sm font-mono text-muted-foreground">{p}%</span>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border p-2">
                <div className="text-[10px] text-muted-foreground">Vlastník</div>
                <div className="font-mono text-sm">{agent.owner}</div>
              </div>
              <div className="rounded-md border border-border p-2">
                <div className="text-[10px] text-muted-foreground">Kategorie</div>
                <div className="font-mono text-sm">{categoryLabel(agent.category)}</div>
              </div>
              <div className="rounded-md border border-border p-2">
                <div className="text-[10px] text-muted-foreground">Status</div>
                <div className="font-mono text-sm">{agent.status.replace(/_/g, " ")}</div>
              </div>
              <div className="rounded-md border border-border p-2">
                <div className="text-[10px] text-muted-foreground">Riziko</div>
                <div className={cn(
                  "font-mono text-sm",
                  agent.risk_level === "low" ? "text-emerald-400" :
                  agent.risk_level === "high" ? "text-rose-400" : "text-amber-400"
                )}>
                  {agent.risk_level}
                </div>
              </div>
              <div className="rounded-md border border-border p-2">
                <div className="text-[10px] text-muted-foreground">Runtime</div>
                <div className="font-mono text-sm">{agent.runtime_status}</div>
              </div>
              <div className="rounded-md border border-border p-2">
                <div className="text-[10px] text-muted-foreground">Priorita</div>
                <div className="font-mono text-sm">{agent.priority}</div>
              </div>
            </div>

            {/* Scope (for design agents) */}
            {agent.scope && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Rozsah oprávnění</h4>
                <p className="text-xs text-muted-foreground">{agent.scope.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.scope.allowed_extensions?.map((ext) => (
                    <Badge key={ext} variant="secondary" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400">
                      {ext}
                    </Badge>
                  ))}
                </div>
                {agent.scope.restricted && agent.scope.restricted.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Zakázáno:</span>
                    {agent.scope.restricted.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px] font-mono bg-rose-500/10 text-rose-400">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

// Need React for createElement in functional components
import React from "react";

export default function WorkflowPage() {
  const [agents, setAgents] = useState<ControlAgent[]>([]);
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
  const [selectedAgent, setSelectedAgent] = useState<ControlAgent | null>(null);

  /* --- Poll agents from Control Center API --- */
  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:4000/executive/control/agents");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data.agents || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenty"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
    const interval = setInterval(() => void loadAgents(), 5000);
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
  const activeCount = agents.filter((a) => a.implementation_progress >= 60).length;
  const inDevCount = agents.filter((a) => a.implementation_progress >= 30 && a.implementation_progress < 60).length;
  const specifiedCount = agents.filter((a) => a.implementation_progress === 0).length;
  const execCount = agents.filter((a) => a.category === "executive").length;
  const designCount = agents.filter((a) => a.category === "design").length;

  /* --- Render --- */
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header with stats bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Live Workflow"
          description="Organizační pipeline — reální agenti MiLO Control Center"
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <Radio className="h-4 w-4 text-emerald-400" />
          <div>
            <div className="text-xs text-muted-foreground">Hotovo</div>
            <div className="font-mono text-lg font-semibold text-emerald-400">{activeCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <Activity className="h-4 w-4 text-amber-400" />
          <div>
            <div className="text-xs text-muted-foreground">Ve vývoji</div>
            <div className="font-mono text-lg font-semibold text-amber-400">{inDevCount}</div>
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
          <Cpu className="h-4 w-4 text-violet-400" />
          <div>
            <div className="text-xs text-muted-foreground">Výkonné</div>
            <div className="font-mono text-lg font-semibold">{execCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
          <Palette className="h-4 w-4 text-pink-400" />
          <div>
            <div className="text-xs text-muted-foreground">Design</div>
            <div className="font-mono text-lg font-semibold">{designCount}</div>
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
            Agent katalog
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {agents.length} agentů
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => {
            const p = agent.implementation_progress;
            const cat = progressToCategory(p);
            const cfg = statusCategoryConfig[cat];
            const isActive = cat === "active" || cat === "thinking";
            const Icon = categoryIcon(agent.category);

            return (
              <Card
                key={agent.id}
                className={cn(
                  "cursor-pointer transition-all duration-500 hover:border-primary/40 hud-card group",
                  isActive ? cfg.glow : "",
                  isActive ? cfg.border : "",
                )}
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
                          <Icon className="h-4 w-4" />
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
                          {agent.slug}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px] px-1.5 py-0", cfg.badge)}>
                      {controlAgentStatusLabel(agent)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {agent.description || agent.purpose || "—"}
                  </p>
                  {isActive && (
                    <div className="space-y-1">
                      <Progress
                        value={p}
                        className="h-1 rounded-full group-hover:h-1.5 transition-all"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        {categoryLabel(agent.category)}
                      </Badge>
                      <span className="font-mono">{p}%</span>
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
            Organizační pipeline
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {agents.length} uzlů
          </Badge>
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
            <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 font-mono text-[10px] text-zinc-500">
                milo@workflow ~ event-stream
              </span>
            </div>

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

              {events.map((evt) => {
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
                    key={evt.id || `${evt.timestamp}-${events.indexOf(evt)}`}
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
