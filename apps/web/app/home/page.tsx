"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  Home, Users, CheckCircle2, Clock, AlertTriangle, Activity,
  RefreshCw, Mail, Sparkles, ChevronRight, Bot,
} from "lucide-react";

const API = "http://localhost:4000";
const REFRESH_MS = 30_000;

interface Agent {
  id: string; name: string; status: string; category: string;
  currentTask: string | null; pendingTasks: number;
  completedTasks: number; failedTasks: number;
}

interface Task {
  id: string; title: string; status: string; priority: string;
  ownerId: string; ownerType: string; createdAt: string;
  description?: string; actualTimeMs?: number; log?: { timestamp: string; level: string; message: string }[];
  result?: { output?: string; error?: string };
}

interface EmailSummary {
  unread: number; important: number; total: number;
  topSenders: string[]; aiSummary: string;
}

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emailSummary, setEmailSummary] = useState<EmailSummary | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [aRes, tRes, eRes] = await Promise.all([
        fetch(`${API}/control-center/agents/live`),
        fetch(`${API}/tasks`),
        fetch(`${API}/email/inbox`),
      ]);

      const aData = await aRes.json();
      const tData = await tRes.json();
      const eData = await eRes.json();

      setAgents(aData.agents || []);
      setTasks(Array.isArray(tData) ? tData : []);

      if (eRes.ok && eData.summary) {
        setEmailSummary(eData.summary);
        setEmailError(null);
      } else if (eData.error) {
        setEmailError(eData.error);
      }
    } catch (e) {
      console.error("Home fetch error:", e);
    }
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Computed stats
  const online = agents.filter((a) => a.status !== "offline").length;
  const aTeam = agents.filter((a) => (a as any).tags?.includes("a_Team"));
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const failedTasks = tasks.filter((t) => t.status === "failed");
  const recentTasks = [...tasks].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  const lastActivityTimestamp = recentTasks.length > 0
    ? new Date(recentTasks[0].createdAt).toLocaleTimeString("cs-CZ")
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="MiLO Home"
        description="Přehled systému, agentů a úkolů"
      >
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString("cs-CZ")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Obnovit
          </Button>
        </div>
      </PageHeader>

      {/* ===== KPI CARDS ===== */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{agents.length}</div>
              <div className="text-sm text-muted-foreground">Agentů</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{online}</div>
              <div className="text-sm text-muted-foreground">Online</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{aTeam.length}</div>
              <div className="text-sm text-muted-foreground">a_Team</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{completedTasks.length}</div>
              <div className="text-sm text-muted-foreground">Splněno</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{failedTasks.length}</div>
              <div className="text-sm text-muted-foreground">Selhalo</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== POSLEDNÍ AKTIVITA (levý sloupec - 2/3) ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agenti */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4" /> Agenti ({agents.length})
                {lastActivityTimestamp && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Poslední aktivita: {lastActivityTimestamp}
                  </span>
                )}
              </h3>
              {agents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádní agenti nedostupní</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {agents.slice(0, 12).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          a.status === "idle"
                            ? "bg-green-400"
                            : a.status === "working"
                            ? "bg-blue-400 animate-pulse"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className="text-sm flex-1 truncate">{a.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Poslední tasky */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Poslední aktivita
              </h3>
              {recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádné tasky</p>
              ) : (
                <div className="space-y-2">
                  {recentTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-accent/30"
                    >
                      {t.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      ) : t.status === "failed" ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(t.createdAt).toLocaleTimeString("cs-CZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Badge
                        variant={
                          t.status === "completed"
                            ? "default"
                            : t.status === "failed"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px] shrink-0"
                      >
                        {t.status === "completed" ? "OK" : t.status === "failed" ? "FAIL" : t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== PRAVÝ SLOUPEC: Email summary ===== */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </h3>
              {emailSummary ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {emailSummary.unread}
                      </div>
                      <div className="text-xs text-muted-foreground">Nepřečtených</div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {emailSummary.important}
                      </div>
                      <div className="text-xs text-muted-foreground">Důležitých</div>
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Sparkles className="w-3 h-3" /> AI shrnutí
                    </div>
                    <p className="text-sm">{emailSummary.aiSummary}</p>
                  </div>
                  {emailSummary.topSenders.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Nejaktivnější odesílatelé:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {emailSummary.topSenders.slice(0, 5).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <a
                    href="/email"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Otevřít emaily <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              ) : emailError ? (
                <div className="text-sm text-muted-foreground">
                  <p>Email shrnutí není dostupné.</p>
                  <p className="text-xs mt-1 text-amber-400">
                    {emailError === "Gmail bridge failed"
                      ? "Gmail token expiroval. Pro obnovení spusť obnovu tokenu."
                      : emailError}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Načítám...</p>
              )}
            </CardContent>
          </Card>

          {/* a_Team */}
          {aTeam.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> a_Team ({aTeam.length})
                </h3>
                <div className="space-y-2">
                  {aTeam.map((a: any) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                    >
                      <Badge variant="default">{a.name}</Badge>
                      <span className="text-xs text-muted-foreground">{a.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
