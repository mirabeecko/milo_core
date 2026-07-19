"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Play, Loader2, RefreshCw, CheckCircle2, Clock, AlertTriangle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";

const API = "http://localhost:4000";

interface KanbanTask {
  id: string;
  title: string;
  status: string;
  assignee: string;
  priority: number;
}

const STATUS_COLORS: Record<string, string> = {
  running: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  done: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  todo: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  blocked: "text-red-400 bg-red-500/10 border-red-500/30",
  failed: "text-red-400 bg-red-500/10 border-red-500/30",
};

const STATUS_ICONS: Record<string, any> = {
  running: Loader2,
  done: CheckCircle2,
  todo: Clock,
  blocked: AlertTriangle,
  failed: AlertTriangle,
};

function TaskCard({ t }: { t: KanbanTask }) {
  const colors = STATUS_COLORS[t.status] || "text-muted-foreground";
  const Icon = STATUS_ICONS[t.status] || Clock;
  const iconSpin = t.status === "running";

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colors.split(" ")[1]} ${colors.split(" ")[2]}`}>
      <Icon className={`w-4 h-4 shrink-0 ${colors.split(" ")[0]} ${iconSpin ? "animate-spin" : ""}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{t.title}</div>
        <div className="flex gap-2 mt-1">
          <Badge variant="outline" className={`text-[10px] ${colors.split(" ")[0]}`}>{t.status}</Badge>
          <Badge variant="outline" className="text-[10px]">@{t.assignee}</Badge>
          {t.priority >= 8 && <Badge className="text-[10px] bg-red-500">PRIO {t.priority}</Badge>}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{t.id.slice(0, 8)}</div>
    </div>
  );
}

export default function WorkspacePage() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTick, setLastTick] = useState(Date.now());
  const [newTitle, setNewTitle] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/phone-tracker/workspace/kanban`);
      if (res.ok) setTasks(await res.json());
    } catch {}
    setLoading(false);
    setLastTick(Date.now());
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [load]);

  const createTask = async () => {
    if (!newTitle.trim()) return;
    await fetch(`${API}/workspace/kanban/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), priority: 7, assignee: "default" }),
    });
    setNewTitle("");
    load();
  };

  const swarm = async () => {
    await fetch(`${API}/phone-tracker/workspace/kanban/swarm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: newTitle.trim() || "Denní analýza a report", workers: 3 }),
    });
    setNewTitle("");
    load();
  };

  const running = tasks.filter(t => t.status === "running").length;
  const done = tasks.filter(t => t.status === "done").length;
  const failed = tasks.filter(t => t.status === "failed" || t.status === "blocked").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-2"><Rocket className="w-5 h-5 text-purple-400" /> Workspace</span>}
        description={`Hermes Kanban engine · ${new Date(lastTick).toLocaleTimeString("cs-CZ")} · obnova 3s`}
        actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Obnovit</Button>}
      />

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Celkem", val: tasks.length, color: "text-white" },
          { label: "Běží", val: running, color: "text-blue-400" },
          { label: "Hotovo", val: done, color: "text-emerald-400" },
          { label: "Chyby", val: failed, color: failed > 0 ? "text-red-400" : "text-muted-foreground" },
        ].map((k, i) => (
          <Card key={i}><CardContent className="p-3 text-center">
            <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* FORM */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Nová mise nebo task..." value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createTask()} className="flex-1" />
            <Button onClick={createTask}><Plus className="w-4 h-4 mr-1" />Úkol</Button>
            <Button onClick={swarm} variant="default" className="bg-purple-600 hover:bg-purple-700">
              <Play className="w-4 h-4 mr-1" />Swarm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KANBAN BOARD */}
      {loading ? <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div> : (
        <div className="space-y-2">
          {tasks.map(t => <TaskCard key={t.id} t={t} />)}
        </div>
      )}
    </div>
  );
}
