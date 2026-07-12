"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Play, Square, RefreshCw, Bot, Send, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle, Clock, Cpu, Palette,
  Activity, Radio, Gauge, Terminal, ArrowRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LiveAgent {
  id: string; slug: string; name: string; category: string;
  status: "online" | "offline" | "working" | "error";
  startedAt: string | null; currentActivity: string;
  progress: number; queueSize: number; historySize: number;
  errorCount: number; capabilities: string[];
}

interface AgentDetail {
  id: string; slug: string; name: string; category: string;
  status: string; startedAt: string | null; currentActivity: string;
  progress: number;
  taskQueue: TaskItem[]; history: TaskItem[]; errors: AgentErrorItem[];
  capabilities: string[];
}

interface TaskItem {
  id: string; title: string; type: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string; completedAt?: string; result?: string; error?: string;
}

interface AgentErrorItem {
  id: string; message: string; severity: string;
  createdAt: string; resolved: boolean;
}

interface ControlAgent {
  id: string; slug: string; name: string; category: string;
  implementation_progress: number;
}

/* ------------------------------------------------------------------ */
/*  API                                                                */
/* ------------------------------------------------------------------ */

const BASE = "http://127.0.0.1:4000";

async function api(path: string, opts?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function statusColor(s: string) {
  switch (s) {
    case "online": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "working": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "error": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    default: return "text-zinc-500 bg-zinc-500/10 border-zinc-500/30";
  }
}

function statusDot(s: string) {
  switch (s) {
    case "online": return "bg-emerald-500";
    case "working": return "bg-amber-500 animate-pulse";
    case "error": return "bg-rose-500";
    default: return "bg-zinc-600";
  }
}

function catIcon(c: string) {
  switch (c) {
    case "executive": return Bot;
    case "design": return Palette;
    default: return Cpu;
  }
}

function catLabel(c: string) {
  switch (c) {
    case "executive": return "Výkonný";
    case "design": return "Design";
    default: return c;
  }
}

/* ------------------------------------------------------------------ */
/*  Agent Card (interaktivní)                                          */
/* ------------------------------------------------------------------ */

function AgentCard({
  agent,
  onRefresh,
}: {
  agent: LiveAgent;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [taskInput, setTaskInput] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const Icon = catIcon(agent.category);

  const loadDetail = useCallback(async () => {
    if (detail) return;
    try {
      const d = await api(`/executive/agents/${agent.id}`);
      setDetail(d);
    } catch {}
  }, [agent.id, detail]);

  useEffect(() => { if (expanded) loadDetail(); }, [expanded, loadDetail]);

  const action = async (fn: () => Promise<void>, label: string) => {
    setLoading(label);
    try { await fn(); onRefresh(); } catch (e: any) { alert(e.message); }
    finally { setLoading(null); }
  };

  const start = () => action(() => api(`/executive/agents/${agent.id}/start`, { method: "POST" }), "start");
  const stop = () => action(() => api(`/executive/agents/${agent.id}/stop`, { method: "POST" }), "stop");
  
  const assignTask = async () => {
    if (!taskInput.trim()) return;
    setLoading("task");
    try {
      await api(`/executive/agents/${agent.id}/task`, {
        method: "POST",
        body: JSON.stringify({ title: taskInput }),
      });
      setTaskInput("");
      setDetail(null); // force reload
      onRefresh();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(null); }
  };

  const resolveError = async (errorId: string) => {
    await action(
      () => api(`/executive/agents/${agent.id}/errors/${errorId}/resolve`, { method: "POST" }),
      "resolve"
    );
    setDetail(null);
  };

  return (
    <Card className={cn(
      "transition-all duration-300 group",
      agent.status === "online" && "border-emerald-500/30",
      agent.status === "working" && "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      agent.status === "error" && "border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                agent.status === "online" && "bg-emerald-500/15 text-emerald-400",
                agent.status === "working" && "bg-amber-500/15 text-amber-400",
                agent.status === "error" && "bg-rose-500/15 text-rose-400",
                agent.status === "offline" && "bg-zinc-700/30 text-zinc-500",
              )}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className={cn(
                "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                statusDot(agent.status),
              )} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{agent.name}</CardTitle>
              <p className="text-[10px] text-muted-foreground truncate">
                {catLabel(agent.category)} · {agent.capabilities.length} capabilities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {agent.errorCount > 0 && (
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] h-5 gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />{agent.errorCount}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px] h-5", statusColor(agent.status))}>
              {agent.status === "online" ? "ON" : agent.status === "working" ? "PRACUJE" : agent.status === "error" ? "CHYBA" : "OFF"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {/* Activity */}
        <p className="text-xs text-muted-foreground truncate">{agent.currentActivity}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {agent.status === "offline" ? (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 flex-1" onClick={start} disabled={!!loading}>
              <Play className="h-3 w-3" />{loading === "start" ? "..." : "Spustit"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 flex-1" onClick={stop} disabled={!!loading}>
              <Square className="h-3 w-3" />{loading === "stop" ? "..." : "Zastavit"}
            </Button>
          )}
          <Button
            size="sm" variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => { setExpanded(!expanded); setDetail(null); }}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="pt-2 border-t border-border space-y-3 animate-fade-in-up">
            {/* Task input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && assignTask()}
                placeholder={agent.category === "design" ? "Např.: změň barvu headeru na modrou" : "Např.: zkontroluj Docker stav"}
                className="flex-1 h-8 rounded-md border border-border bg-muted/30 px-2.5 text-xs focus:outline-none focus:border-primary/50"
              />
              <Button size="sm" className="h-8 text-xs gap-1" onClick={assignTask} disabled={!taskInput.trim() || !!loading}>
                <Send className="h-3 w-3" />{loading === "task" ? "..." : "Zadat"}
              </Button>
            </div>

            {/* Progress */}
            {(agent.status === "working" || agent.progress > 0) && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-mono">{agent.progress}%</span>
                </div>
                <Progress value={agent.progress} className="h-1" />
              </div>
            )}

            {/* Errors */}
            {detail?.errors && detail.errors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-rose-400 uppercase">Chyby ({detail.errors.length})</p>
                {detail.errors.map(err => (
                  <div key={err.id} className="flex items-start justify-between gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 p-2">
                    <div className="min-w-0">
                      <p className="text-xs text-rose-300">{err.message}</p>
                      <p className="text-[10px] text-rose-500/60 mt-0.5">{new Date(err.createdAt).toLocaleTimeString("cs-CZ")}</p>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="h-6 text-[10px] shrink-0 border-rose-500/30 hover:bg-rose-500/10"
                      onClick={() => resolveError(err.id)}
                    >
                      Vyřešit
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* History */}
            {detail?.history && detail.history.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Historie ({detail.history.length})</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {detail.history.slice().reverse().slice(0, 10).map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-[10px] py-0.5">
                      {t.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> :
                       t.status === "failed" ? <XCircle className="h-3 w-3 text-rose-400 shrink-0" /> :
                       <Clock className="h-3 w-3 text-amber-400 shrink-0" />}
                      <span className="truncate flex-1">{t.title}</span>
                      <span className="text-muted-foreground font-mono shrink-0">
                        {new Date(t.createdAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Capabilities */}
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.map(c => (
                <Badge key={c} variant="secondary" className="text-[9px] h-4 font-mono">{c}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Org Chart (zjednodušený)                                           */
/* ------------------------------------------------------------------ */

function OrgChart({ agents }: { agents: LiveAgent[] }) {
  const exec = agents.filter(a => a.category === "executive");
  const design = agents.filter(a => a.category === "design");
  const orchestrator = exec.find(a => a.slug === "chief-orchestrator");
  const others = exec.filter(a => a.slug !== "chief-orchestrator");

  return (
    <Card className="bg-card/60 overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col items-center gap-3">
          {/* Owner */}
          <div className="flex items-center gap-2 rounded-full border-2 border-dashed border-muted-foreground/30 px-4 py-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Vlastník</span>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />

          {/* Orchestrator */}
          {orchestrator && (
            <>
              <div className={cn(
                "flex items-center gap-3 rounded-lg border-2 px-4 py-2.5 min-w-[220px]",
                orchestrator.status === "online" && "border-emerald-500/40 bg-emerald-500/5",
                orchestrator.status === "working" && "border-amber-500/40 bg-amber-500/5",
                orchestrator.status === "error" && "border-rose-500/40 bg-rose-500/5",
                orchestrator.status === "offline" && "border-border",
              )}>
                <div className="relative">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className={cn("absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-background", statusDot(orchestrator.status))} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{orchestrator.name}</p>
                  <p className="text-[10px] text-muted-foreground">{orchestrator.currentActivity}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
                {/* Fan out to department heads */}
                {others.map(a => (
                  <div key={a.id} className="flex flex-col items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    <div className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
                      a.status === "online" && "border-emerald-500/30 bg-emerald-500/5",
                      a.status === "working" && "border-amber-500/30 bg-amber-500/5",
                      a.status === "error" && "border-rose-500/30 bg-rose-500/5",
                      a.status === "offline" && "border-border",
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(a.status))} />
                      <span className="font-medium truncate max-w-[100px]">{a.name.replace("Chief ", "")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Design agents */}
          {design.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {design.map(a => (
                  <div key={a.id} className="flex flex-col items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    <div className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
                      a.status === "online" && "border-pink-500/30 bg-pink-500/5",
                      a.status === "offline" && "border-border",
                    )}>
                      <Palette className="h-3 w-3 text-pink-400" />
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function WorkflowPage() {
  const [agents, setAgents] = useState<LiveAgent[]>([]);
  const [controlAgents, setControlAgents] = useState<ControlAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [live, cc] = await Promise.all([
        api("/executive/agents/live"),
        api("/executive/control/agents"),
      ]);
      setAgents(live.agents || []);
      setControlAgents(cc.agents || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-48 w-full" />))}
        </div>
      </div>
    );
  }

  const onlineCount = agents.filter(a => a.status !== "offline").length;
  const errorCount = agents.filter(a => a.errorCount > 0).length;
  const workingCount = agents.filter(a => a.status === "working").length;
  const totalTasks = agents.reduce((s, a) => s + a.historySize, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Live Workflow" description="Interaktivní ovládání agentů — spouštěj, zadávej úkoly, řeš chyby" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" />Obnovit
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat icon={Radio} label="Online" value={onlineCount} color="text-emerald-400" />
        <Stat icon={Activity} label="Pracuje" value={workingCount} color="text-amber-400" />
        <Stat icon={Bot} label="Celkem" value={agents.length} color="text-blue-400" />
        <Stat icon={CheckCircle2} label="Úkolů" value={totalTasks} color="text-emerald-400" />
        <Stat icon={AlertTriangle} label="S chybami" value={errorCount} color="text-rose-400" />
        <Stat icon={Gauge} label="LIVE" value={onlineCount > 0 ? "ANO" : "NE"} color={onlineCount > 0 ? "text-emerald-400" : "text-zinc-500"} />
      </div>

      {/* Org Chart */}
      <OrgChart agents={agents} />

      {/* Agent Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map(a => (
          <AgentCard key={a.id} agent={a} onRefresh={load} />
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-3">
      <Icon className={cn("h-4 w-4 shrink-0", color)} />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("font-mono text-lg font-semibold", color)}>{value}</div>
      </div>
    </div>
  );
}
