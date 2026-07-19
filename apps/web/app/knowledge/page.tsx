"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, Activity, Eye, Lightbulb, Shield, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";

const API = "http://localhost:4000";

export default function KnowledgePage() {
  const [report, setReport] = useState<any>(null);
  const [live, setLive] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [aTeam, setATeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, lRes, tRes, aRes] = await Promise.all([
        fetch(`${API}/control-center/reports/tester-boss`),
        fetch(`${API}/control-center/agents/live`),
        fetch(`${API}/tasks`),
        fetch(`${API}/control-center/agents`),
      ]);
      if (rRes.ok) setReport(await rRes.json());
      if (lRes.ok) setLive(await lRes.json());
      if (tRes.ok) setTasks(await tRes.json());
      if (aRes.ok) {
        const allAgents = await aRes.json();
        const ateam = allAgents.filter((a: any) => (a.tags || []).includes("a_Team"));
        setATeam(ateam);
      }
      setLastRefresh(new Date().toLocaleTimeString("cs-CZ"));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const online = live?.agents?.filter((a: any) => a.status !== "offline").length ?? 0;
  const total = live?.total ?? 0;
  const recentTasks = Array.isArray(tasks) ? tasks.slice(-5).reverse() : [];
  const completed = recentTasks.filter((t: any) => t.status === "completed").length;
  const failed = recentTasks.filter((t: any) => t.status === "failed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Knowledge & Monitoring"
        description="Vysvětlení monitoringu, živá data, systémová kontrola"
        icon={BookOpen}
        actions={
          <div className="flex items-center gap-2">
            {lastRefresh && <span className="text-xs text-muted-foreground">🕐 {lastRefresh}</span>}
            <Button variant="outline" size="sm" onClick={fetchAll}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Obnovit
            </Button>
          </div>
        }
      />

      {/* ─── VYSVĚTLENÍ MONITORINGU ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Jak funguje monitoring
          </CardTitle>
          <CardDescription>
            Systém automaticky kontroluje stav agentů, pipeline a dat každých 30 sekund
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-semibold mb-1 flex items-center gap-1">
                <Activity className="w-4 h-4" /> Tester BOSS
              </h4>
              <p className="text-muted-foreground">
                Každých 30 min testuje všech 23 agentů — definici, progres, stav.
                Report dostupný přes API.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-semibold mb-1 flex items-center gap-1">
                <Eye className="w-4 h-4" /> SPY_G
              </h4>
              <p className="text-muted-foreground">
                Skrytý pozorovatel. Každé pondělí report. Hlídá gamechanger
                nápady a křížové souvislosti.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-semibold mb-1 flex items-center gap-1">
                <Zap className="w-4 h-4" /> Pipeline
              </h4>
              <p className="text-muted-foreground">
                Agent pipeline: start → delegate → runTask → execute →
                completed. Odezva ~9 ms.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── SYSTÉMOVÁ KONTROLA ─── */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Agentů celkem</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${online === total ? "text-green-400" : "text-yellow-400"}`}>{online}</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{aTeam.length}</div>
            <div className="text-xs text-muted-foreground">a_Team</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{completed}/{recentTasks.length}</div>
            <div className="text-xs text-muted-foreground">Tasky OK</div>
          </CardContent></Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── TESTER BOSS ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Tester BOSS Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!report ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex gap-4">
                  <Badge variant="default">✅ {report.summary?.passed ?? 0}</Badge>
                  <Badge variant="secondary">⚠️ {report.summary?.warnings ?? 0}</Badge>
                  <Badge variant="destructive">❌ {report.summary?.failed ?? 0}</Badge>
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {report.agents?.filter((a: any) => a.status !== "passed").slice(0, 6).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      {a.status === "failed" ? <AlertTriangle className="w-3 h-3 text-red-400" /> :
                       <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                      <span className="flex-1">{a.name}</span>
                      <span className="text-muted-foreground">{a.progress}%</span>
                      <span className="text-muted-foreground">{a.missing?.[0] || ""}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  🕐 {report.timestamp}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── SPY_G + TASKY ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              SPY_G Watchlist & Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Sledované položky
                </h4>
                <div className="text-xs text-muted-foreground">
                  SPY_G hlídá gamechanger nápady. Report každé pondělí 9:00.
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Poslední tasky
                </h4>
                <div className="space-y-1">
                  {recentTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs">
                      {t.status === "completed" ? <CheckCircle2 className="w-3 h-3 text-green-400" /> :
                       t.status === "failed" ? <AlertTriangle className="w-3 h-3 text-red-400" /> :
                       <Clock className="w-3 h-3 text-yellow-400" />}
                      <span className="flex-1">{t.title}</span>
                      <Badge variant={t.status === "completed" ? "default" : t.status === "failed" ? "destructive" : "outline"}
                        className="text-xs">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
