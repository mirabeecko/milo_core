"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radio, CheckCircle2, Clock, AlertTriangle, Play, Pause, RefreshCw,
  User, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API = "http://localhost:4000";
const POLL_MS = 2000;

const STATUS_MAP: Record<string, { color: string; bg: string; border: string; label: string }> = {
  working: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "PRACUJE" },
  thinking: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", label: "PŘEMÝŠLÍ" },
  planning: { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", label: "PLÁNUJE" },
  delegating: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", label: "DELEGUJE" },
  idle: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", label: "ČEKÁ" },
  paused: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "POZASTAVEN" },
  error: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "CHYBA" },
  offline: { color: "text-gray-500", bg: "bg-gray-500/5", border: "border-gray-500/10", label: "OFFLINE" },
  completed: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "DOKONČENO" },
  failed: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "SELHALO" },
};

export default function RealtimePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastTick, setLastTick] = useState(Date.now());
  const [showFailed, setShowFailed] = useState(true);
  const prevTasks = useRef<Set<string>>(new Set());
  const prevStatuses = useRef<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const tick = useCallback(async () => {
    try {
      const [aRes, tRes] = await Promise.all([
        fetch(`${API}/control-center/agents/live`),
        fetch(`${API}/tasks`),
      ]);
      const now = Date.now();

      if (aRes.ok) {
        const data = await aRes.json();
        const newAgents = data.agents || data || [];
        newAgents.forEach((a: any) => {
          const prev = prevStatuses.current[a.id];
          if (prev && prev !== a.status) {
            setEvents(prev => [{
              id: `${now}-${a.id}-status`,
              ts: now,
              agent: a.name || a.id,
              detail: `${prev} → ${a.status}`,
              type: "status",
              status: a.status,
            }, ...prev].slice(0, 100));
          }
          prevStatuses.current[a.id] = a.status;
        });
        setAgents(newAgents);
      }

      if (tRes.ok) {
        const tData = await tRes.json();
        const newTasks = Array.isArray(tData) ? tData.slice(-30) : [];
        newTasks.forEach((t: any) => {
          if (!prevTasks.current.has(t.id)) {
            prevTasks.current.add(t.id);
            setEvents(prev => [{
              id: `${now}-${t.id}`,
              ts: now,
              agent: t.ownerId || "?",
              detail: t.title,
              type: t.status === "failed" ? "error" : "task",
              status: t.status,
              output: t.output,
              createdBy: t.ownerId,
            }, ...prev].slice(0, 100));
          }
        });
        setTasks(newTasks);
      }
    } catch {}
    setLoading(false);
    setLastTick(Date.now());
  }, []);

  useEffect(() => {
    tick();
    if (!paused) {
      const i = setInterval(tick, POLL_MS);
      return () => clearInterval(i);
    }
  }, [paused, tick]);

  // Auto-scroll to new events
  useEffect(() => { listRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [events.length]);

  const online = agents.filter((a: any) => a.status !== "offline").length;
  const working = agents.filter((a: any) =>
    ["working", "thinking", "planning", "delegating"].includes(a.status)).length;
  const errors = events.filter(e => e.type === "error").length;
  const activeNow = working > 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-4" style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeNow ? "bg-red-500" : "bg-green-500"}`} />
            <span className={`relative inline-flex rounded-full h-4 w-4 ${activeNow ? "bg-red-500" : "bg-green-500"}`} />
          </span>
          <h1 className="text-lg font-bold tracking-wider" style={{ color: activeNow ? "#f87171" : "#4ade80" }}>
            REAL TIME MONITORING
          </h1>
          <span className="text-xs text-muted-foreground">
            {new Date(lastTick).toLocaleTimeString("cs-CZ")} · {POLL_MS / 1000}s
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant={showFailed ? "destructive" : "outline"} size="sm" onClick={() => setShowFailed(!showFailed)}>
            <AlertTriangle className="w-3 h-3 mr-1" />Chyby {errors}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPaused(!paused)}>
            {paused ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
            {paused ? "START" : "STOP"}
          </Button>
        </div>
      </div>

      {/* TOP BAR */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { label: "ONLINE", val: `${online}/${agents.length}`, color: "#4ade80" },
          { label: "AKTIVNÍ", val: working, color: activeNow ? "#f87171" : "#6b7280" },
          { label: "TASKŮ", val: tasks.length, color: "#60a5fa" },
          { label: "CHYBY", val: errors, color: errors > 0 ? "#f87171" : "#6b7280" },
          { label: "EVENTŮ", val: events.length, color: "#a78bfa" },
          { label: "TICK", val: POLL_MS / 1000 + "s", color: "#6b7280" },
        ].map((k, i) => (
          <div key={i} className="rounded border border-border p-2 text-center">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-lg font-bold" style={{ color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* AGENTS — levý sloupec */}
        <div className="lg:col-span-2 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <User className="w-3 h-3" /> Agenti — LIVE
          </div>
          <div className="space-y-1 max-h-[600px] overflow-auto">
            {loading && agents.length === 0
              ? [1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded" />)
              : agents.map((a: any) => {
                  const s = STATUS_MAP[a.status] || STATUS_MAP.offline;
                  return (
                    <div key={a.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded border ${s.border} ${s.bg} transition-all`}>
                      <span className="relative flex h-2 w-2 shrink-0">
                        {["working","thinking","planning","delegating"].includes(a.status) && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${s.color.replace("text-","bg-")}`} />
                      </span>
                      <span className="text-sm font-medium flex-1 truncate">{a.name || a.id}</span>
                      <Badge variant="outline" className={`text-[10px] ${s.color}`}>{s.label}</Badge>
                      {a.progressPercent != null && (
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{a.progressPercent}%</span>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* TASK PIPELINE + EVENTS — pravý sloupec */}
        <div className="lg:col-span-3 space-y-4">
          {/* AKTIVNÍ TASKY */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Pipeline — posledních 15
            </div>
            <div ref={listRef} className="space-y-1 max-h-[300px] overflow-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">Žádné tasky</p>
              ) : (
                [...tasks]
                  .filter(t => showFailed || t.status !== "failed")
                  .slice(0, 15)
                  .map((t: any) => {
                    const s = STATUS_MAP[t.status] || STATUS_MAP.idle;
                    return (
                      <div key={t.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded border text-sm ${s.border} ${t.status === "failed" ? "bg-red-500/5" : "bg-card"}`}>
                        {/* Status indikátor */}
                        {t.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> :
                         t.status === "failed" ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> :
                         t.status === "pending" ? <Clock className="w-4 h-4 text-yellow-400 shrink-0" /> :
                         <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
                        {/* Obsah */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{t.title}</span>
                            <Badge variant="outline" className={`text-[10px] ${s.color}`}>{s.label}</Badge>
                          </div>
                          <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
                            <span>👤 {t.ownerId || "—"}</span>
                            {t.completedAt && <span>✅ {new Date(t.completedAt).toLocaleTimeString("cs-CZ")}</span>}
                            {t.output && <span className="truncate max-w-[200px]">📤 {t.output.slice(0, 60)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* EVENT STREAM */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Radio className="w-3 h-3 text-red-400" style={{ animation: "pulse 1s infinite" }} /> Stream událostí
            </div>
            <div className="space-y-1 max-h-[250px] overflow-auto">
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 font-mono">Čekám na události...</p>
              ) : (
                events.slice(0, 20).map((e) => (
                  <div key={e.id}
                    className={`flex items-start gap-2 px-3 py-1.5 rounded text-xs font-mono border-l-2 ${
                      e.type === "error" ? "border-l-red-500 bg-red-500/5" :
                      e.type === "status" ? "border-l-blue-500 bg-blue-500/5" :
                      "border-l-green-500 bg-transparent"
                    }`}>
                    <span className="text-muted-foreground shrink-0 w-12">
                      {new Date(e.ts).toLocaleTimeString("cs-CZ")}
                    </span>
                    {e.type === "error" ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /> :
                     e.type === "status" ? <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" /> :
                     <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />}
                    <span className="font-medium text-blue-300">{e.agent}</span>
                    <span className="text-muted-foreground">{e.detail}</span>
                    {e.output && <span className="text-emerald-400/70">→ {e.output.slice(0, 40)}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
