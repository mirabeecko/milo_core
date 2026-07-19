"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import {
  Play,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  BarChart3,
  RefreshCw,
  Zap,
  Activity,
  AlertTriangle,
  Radio,
  Loader2,
} from "lucide-react";

const API = "http://localhost:4000";

interface TestResult {
  name: string;
  category: string;
  url: string;
  method: string;
  status: "pass" | "fail" | "skip";
  httpStatus: number | null;
  durationMs: number;
  error?: string;
  bodyPreview?: string;
}

interface TestRun {
  id: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  results: TestResult[];
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "API Core": "border-blue-500/30",
  "Agents": "border-purple-500/30",
  "Tasks": "border-yellow-500/30",
  "Phone Tracker": "border-green-500/30",
  "SPY_G": "border-pink-500/30",
  "Kanban": "border-indigo-500/30",
  "Delegations": "border-orange-500/30",
  "Calendar": "border-cyan-500/30",
  "Email": "border-teal-500/30",
  "Executive": "border-amber-500/30",
  "Briefing": "border-rose-500/30",
  "Home": "border-lime-500/30",
  "Activity": "border-fuchsia-500/30",
  "Knowledge": "border-sky-500/30",
  "Missions": "border-violet-500/30",
  "Projects": "border-emerald-500/30",
  "Settings": "border-slate-500/30",
  "Web Pages": "border-red-500/30",
};

export default function TesterPage() {
  const [run, setRun] = useState<TestRun | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastTick, setLastTick] = useState(Date.now());
  const [events, setEvents] = useState<{ id: string; ts: number; msg: string; type: string }[]>([]);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Load latest results
  const loadResults = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tester/results`);
      if (res.ok) {
        const data = await res.json();
        if (data.totalTests > 0) setRun(data);
      }
    } catch {}
    setLastTick(Date.now());
  }, []);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tester/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.runs || []);
      }
    } catch {}
  }, []);

  useEffect(() => { loadResults(); loadHistory(); }, [loadResults, loadHistory]);

  // Run tests
  const runTests = async () => {
    setRunning(true);
    setLoading(true);
    setProgress(0);
    setEvents([{ id: "start", ts: Date.now(), msg: "🚀 Spouštím testy...", type: "info" }]);

    // Simulate progress during the fetch
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 90));
    }, 300);

    try {
      setEvents((prev) => [...prev, { id: `req-${Date.now()}`, ts: Date.now(), msg: "📡 Odesílám request na /tester/run...", type: "info" }]);

      const res = await fetch(`${API}/tester/run`, { method: "POST" });

      clearInterval(progressInterval);
      setProgress(100);

      if (res.ok) {
        const data: TestRun = await res.json();
        setRun(data);
        setEvents((prev) => [...prev, {
          id: `done-${Date.now()}`,
          ts: Date.now(),
          msg: `✅ Hotovo! ${data.passed}/${data.totalTests} prošlo, ${data.failed} selhalo, ${data.skipped} přeskočeno (${data.durationMs}ms)`,
          type: data.failed > 0 ? "warn" : "success",
        }]);
      } else {
        setEvents((prev) => [...prev, { id: `err-${Date.now()}`, ts: Date.now(), msg: `❌ Server vrátil HTTP ${res.status}`, type: "error" }]);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setEvents((prev) => [...prev, { id: `err-${Date.now()}`, ts: Date.now(), msg: `❌ Chyba: ${err.message}`, type: "error" }]);
    }

    setRunning(false);
    setLoading(false);
    loadHistory();
    setLastTick(Date.now());
  };

  // Auto-scroll events
  useEffect(() => { eventsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [events]);

  const passRate = run ? Math.round((run.passed / run.totalTests) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> MiLO TESTER</span>}
        description={`Automatické testování celého MiLO · ${new Date(lastTick).toLocaleTimeString("cs-CZ")} · Auto-test každých 30 min`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { loadResults(); loadHistory(); }}>
              <RefreshCw className="w-4 h-4 mr-1" />Obnovit
            </Button>
          </div>
        }
      />

      {/* MAIN CTA */}
      <Card className="border-2 border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Zap className="w-12 h-12 text-yellow-400" style={{ animation: "pulse 2s infinite" }} />
            <div>
              <h2 className="text-2xl font-bold">Testování celého MiLO systému</h2>
              <p className="text-muted-foreground mt-1">
                Otestuje všechny API endpointy, webové stránky, agenty, SPY_G, Kanban a další
              </p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={runTests}
            disabled={running}
            className="text-lg px-10 py-6 font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black shadow-lg shadow-yellow-500/25"
            style={{ minWidth: 280 }}
          >
            {running ? (
              <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> TESTOVÁNÍ...</>
            ) : (
              <><Play className="w-6 h-6 mr-2" /> SPUSTIT TESTY</>
            )}
          </Button>

          {/* Progress bar */}
          {running && (
            <div className="max-w-xl mx-auto space-y-2">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #fbbf24, #f97316, #ef4444)",
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">Testuji... {Math.round(progress)}%</p>
            </div>
          )}

          {run && !running && (
            <div className="text-sm text-muted-foreground">
              Poslední test: {new Date(run.timestamp).toLocaleString("cs-CZ")} · {run.durationMs}ms
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI */}
      {run && run.totalTests > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Celkem testů", val: run.totalTests, color: "text-white" },
            { label: "Prošlo", val: run.passed, color: "text-emerald-400", icon: CheckCircle2 },
            { label: "Selhalo", val: run.failed, color: run.failed > 0 ? "text-red-400" : "text-muted-foreground", icon: XCircle },
            { label: "Přeskočeno", val: run.skipped, color: "text-yellow-400", icon: SkipForward },
            { label: "Úspěšnost", val: `${passRate}%`, color: passRate >= 90 ? "text-emerald-400" : passRate >= 70 ? "text-yellow-400" : "text-red-400", icon: BarChart3 },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <Card key={i} className={k.val !== 0 && k.color.includes("red") ? "border-red-500/30 bg-red-500/5" : ""}>
                <CardContent className="p-3 text-center">
                  <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {Icon && <Icon className="w-3 h-3" />}
                    {k.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* RESULTS BY CATEGORY */}
      {run && run.results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Výsledky testů
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {Object.entries(
              run.results.reduce<Record<string, TestResult[]>>((acc, r) => {
                if (!acc[r.category]) acc[r.category] = [];
                acc[r.category].push(r);
                return acc;
              }, {})
            ).map(([category, results]) => (
              <div key={category} className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full border ${CATEGORY_COLORS[category] || "border-border"}`} />
                  {category}
                  <Badge variant="outline" className="text-[10px]">
                    {results.filter(r => r.status === "pass").length}/{results.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2 rounded border text-sm ${
                        r.status === "pass"
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : r.status === "fail"
                          ? "border-red-500/20 bg-red-500/5"
                          : "border-yellow-500/20 bg-yellow-500/5"
                      }`}
                    >
                      {/* Status icon */}
                      {r.status === "pass" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : r.status === "fail" ? (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <SkipForward className="w-4 h-4 text-yellow-400 shrink-0" />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{r.name}</span>
                          <Badge variant="outline" className="text-[10px]">{r.method}</Badge>
                          {r.httpStatus && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                r.httpStatus < 300 ? "text-emerald-400" :
                                r.httpStatus < 500 ? "text-yellow-400" :
                                "text-red-400"
                              }`}
                            >
                              {r.httpStatus}
                            </Badge>
                          )}
                        </div>
                        {r.error && (
                          <div className="text-[11px] text-red-400 mt-0.5 truncate">{r.error}</div>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="text-[10px] text-muted-foreground w-10 text-right shrink-0">
                        {r.durationMs}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* LIVE EVENTS */}
      {events.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" style={{ animation: "pulse 1s infinite" }} />
              Live log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[200px] overflow-auto font-mono text-xs">
              {events.map((e) => (
                <div
                  key={e.id}
                  className={`px-2 py-1 rounded border-l-2 ${
                    e.type === "error" ? "border-l-red-500 bg-red-500/5" :
                    e.type === "warn" ? "border-l-yellow-500 bg-yellow-500/5" :
                    e.type === "success" ? "border-l-emerald-500 bg-emerald-500/5" :
                    "border-l-blue-500 bg-blue-500/5"
                  }`}
                >
                  <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString("cs-CZ")}</span>{" "}
                  {e.msg}
                </div>
              ))}
              <div ref={eventsEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historie testů (posledních {Math.min(history.length, 20)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 20).map((h, i) => {
                const passRate = Math.round((h.passed / h.totalTests) * 100);
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 px-3 py-2 rounded border border-border text-sm hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      h.failed === 0 ? "bg-emerald-400" : h.failed <= 3 ? "bg-yellow-400" : "bg-red-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {new Date(h.timestamp).toLocaleString("cs-CZ")}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{h.id}</Badge>
                      </div>
                      <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
                        <span className="text-emerald-400">✅ {h.passed}</span>
                        <span className={h.failed > 0 ? "text-red-400" : ""}>❌ {h.failed}</span>
                        <span className="text-yellow-400">⏭️ {h.skipped}</span>
                        <span className="text-blue-400">{passRate}%</span>
                        <span>⏱️ {h.durationMs}ms</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!run && !running && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-400" />
            <div>
              <p className="text-lg font-medium">Zatím žádné výsledky</p>
              <p className="text-muted-foreground">
                Klikněte na tlačítko SPUSTIT TESTY pro otestování celého MiLO systému.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
