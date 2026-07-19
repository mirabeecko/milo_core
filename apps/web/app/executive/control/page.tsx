"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bot, Play, Pause, RefreshCw, Clock, CheckCircle2, XCircle,
  AlertTriangle, Activity, Zap, Terminal, Calendar, Mail, Search,
  Power, RotateCcw, ArrowRight, BarChart3, Cpu, HardDrive,
  Wifi, WifiOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────

interface CronJob {
  job_id: string;
  name: string;
  schedule: string;
  next_run: string;
  last_run: string | null;
  last_status: "ok" | "error" | null;
  enabled: boolean;
  state: string;
}

interface SystemInfo {
  hermes: { status: string; sessions: number };
  system: { cpu: number; memory: number; disk: number; uptime: string };
  timestamp: string;
}

interface AgentState {
  id: string;
  name: string;
  type: "cron" | "skill";
  status: "running" | "idle" | "error" | "offline";
  detail: string;
  action?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "nikdy";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "teď";
  if (mins < 60) return `před ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `před ${hrs}h`;
  return `před ${Math.floor(hrs / 24)}d`;
}

function nextIn(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const mins = Math.floor(diff / 60000);
  if (mins < 0) return "vypršelo";
  if (mins < 60) return `za ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `za ${hrs}h`;
  return `za ${Math.floor(hrs / 24)}d`;
}

// ─── Component ───────────────────────────────────────────

export default function ControlCenterPage() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sysRes, cronRes] = await Promise.all([
        fetch("http://127.0.0.1:4000/api/system").then(r => r.json()).catch(() => null),
        fetch("http://127.0.0.1:4000/api/hermes/cron").then(r => r.json()).catch(() => []),
      ]);

      setSystem(sysRes);

      const jobs: CronJob[] = Array.isArray(cronRes) ? cronRes : [];
      setCronJobs(jobs);

      // Map cron jobs + known skills to "agents"
      const agentList: AgentState[] = [
        ...jobs.map(j => ({
          id: j.job_id,
          name: j.name,
          type: "cron" as const,
          status: (!j.enabled ? "offline" : j.last_status === "error" ? "error" : j.last_status === "ok" ? "idle" : "running") as AgentState["status"],
          detail: j.enabled
            ? `${j.schedule} · poslední běh: ${timeAgo(j.last_run)} · další: ${nextIn(j.next_run)}`
            : "pozastaveno",
          action: j.enabled ? "pause" : "resume",
        })),
        // Known skills as capability agents
        { id: "chief-of-staff", name: "Chief of Staff", type: "skill", status: "running", detail: "Denní briefing 7:30", action: "view" },
        { id: "developer-agent", name: "Developer Agent", type: "skill", status: "idle", detail: "Připraven na technické úkoly", action: "assign" },
        { id: "research-agent", name: "Research Agent", type: "skill", status: "idle", detail: "Vyhledávání a rešerše", action: "assign" },
        { id: "calendar-agent", name: "Calendar Agent", type: "skill", status: "idle", detail: "Google Kalendář", action: "assign" },
        { id: "communication-agent", name: "Communication Agent", type: "skill", status: "idle", detail: "Gmail triage", action: "assign" },
        { id: "spy-g", name: "SPY_G", type: "skill", status: "running", detail: "Evidence úkolů · kontrola pondělí 9:00", action: "view" },
      ];
      setAgents(agentList);
    } catch (e: any) {
      setError(e.message || "Nepodařilo se načíst data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [loadAll]);

  async function handleAction(agentId: string, action: string) {
    setActing(prev => new Set(prev).add(agentId));
    try {
      const agent = agents.find(a => a.id === agentId);
      if (agent?.type === "cron") {
        const op = action === "pause" ? "pause" : action === "resume" ? "resume" : "run";
        await fetch(`http://127.0.0.1:4000/api/hermes/cron/${agentId}/${op}`, { method: "POST" });
      }
      await loadAll();
    } catch (e) {
      console.error(e);
    }
    setActing(prev => {
      const next = new Set(prev);
      next.delete(agentId);
      return next;
    });
  }

  const activeAgents = agents.filter(a => a.status === "running" || a.status === "idle").length;
  const errorAgents = agents.filter(a => a.status === "error").length;
  const offlineAgents = agents.filter(a => a.status === "offline").length;

  const activeCron = cronJobs.filter(j => j.enabled).length;
  const cronErrors = cronJobs.filter(j => j.last_status === "error").length;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reálná data z Hermes · Auto-refresh každých 15s
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Obnovit
          </Button>
          <Button size="sm" className="gap-2" onClick={() => window.open("http://localhost:3000", "_blank")}>
            <Zap className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
            <Button variant="outline" size="sm" onClick={loadAll}>Zkusit znovu</Button>
          </CardContent>
        </Card>
      )}

      {/* System status bar */}
      {system && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SystemBadge
            icon={Cpu}
            label="CPU"
            value={`${system.system.cpu}%`}
            color={system.system.cpu > 80 ? "rose" : "emerald"}
          />
          <SystemBadge
            icon={HardDrive}
            label="RAM"
            value={`${system.system.memory}%`}
            color={system.system.memory > 80 ? "rose" : "emerald"}
          />
          <SystemBadge
            icon={HardDrive}
            label="Disk"
            value={`${system.system.disk}%`}
            color={system.system.disk > 80 ? "amber" : "emerald"}
          />
          <SystemBadge
            icon={Clock}
            label="Uptime"
            value={system.system.uptime}
            color="blue"
          />
          <SystemBadge
            icon={system.hermes.status === "running" ? Wifi : WifiOff}
            label="Hermes"
            value={system.hermes.status === "running" ? "Online" : "Offline"}
            color={system.hermes.status === "running" ? "emerald" : "rose"}
          />
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={Bot}
          label="Agenti"
          value={activeAgents}
          total={agents.length}
          color="violet"
          details={[
            { label: "Běží", value: agents.filter(a => a.status === "running").length, color: "emerald" },
            { label: "Chyby", value: errorAgents, color: "rose" },
            { label: "Offline", value: offlineAgents, color: "muted" },
          ]}
        />
        <SummaryCard
          icon={Clock}
          label="Cron joby"
          value={activeCron}
          total={cronJobs.length}
          color="amber"
          details={[
            { label: "Aktivní", value: activeCron, color: "emerald" },
            { label: "Chyby", value: cronErrors, color: "rose" },
            { label: "Pozastaveno", value: cronJobs.filter(j => !j.enabled).length, color: "muted" },
          ]}
        />
        <SummaryCard
          icon={Terminal}
          label="Sessions"
          value={system?.hermes.sessions || 0}
          color="blue"
          details={[]}
        />
        <SummaryCard
          icon={Zap}
          label="Rychlé akce"
          value={4}
          color="emerald"
          details={[]}
        />
      </div>

      {/* Grid: Agents + Cron jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-400" />
              Aktivní agenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors group"
              >
                <StatusDot status={agent.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{agent.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {agent.type === "cron" ? "cron" : "skill"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0 h-4",
                        agent.status === "running" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                        agent.status === "idle" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                        agent.status === "error" && "border-rose-500/30 bg-rose-500/10 text-rose-400",
                        agent.status === "offline" && "border-muted/30 text-muted-foreground",
                      )}
                    >
                      {agent.status === "running" ? "běží" : agent.status === "idle" ? "připraven" : agent.status === "error" ? "chyba" : "offline"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{agent.detail}</p>
                </div>
                {agent.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100"
                    disabled={acting.has(agent.id)}
                    onClick={() => handleAction(agent.id, agent.action!)}
                  >
                    {agent.action === "pause" && <><Pause className="h-3 w-3" /> Pozastavit</>}
                    {agent.action === "resume" && <><Play className="h-3 w-3" /> Spustit</>}
                    {agent.action === "assign" && <><ArrowRight className="h-3 w-3" /> Zadat úkol</>}
                    {agent.action === "view" && <><ArrowRight className="h-3 w-3" /> Detail</>}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cron jobs detail */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Naplánované úlohy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cronJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Žádné naplánované úlohy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cronJobs.map(job => (
                  <div key={job.job_id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusDot status={job.last_status === "error" ? "error" : job.enabled ? "running" : "offline"} />
                        <span className="text-sm font-medium">{job.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {job.schedule}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="text-muted-foreground/60">Poslední běh:</span>{" "}
                        {job.last_run ? timeAgo(job.last_run) : "nikdy"}
                        {job.last_status === "error" && (
                          <XCircle className="h-3 w-3 text-rose-400 inline ml-1" />
                        )}
                        {job.last_status === "ok" && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 inline ml-1" />
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground/60">Další běh:</span>{" "}
                        {nextIn(job.next_run)}
                      </div>
                    </div>
                    {job.state === "paused" && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                        <Pause className="h-3 w-3" />
                        Pozastaveno
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Rychlé akce
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <QuickActionButton
              icon={Calendar}
              label="Spustit ranní briefing"
              description="Chief of Staff"
              onClick={() => handleAction("5acd17d67809", "run")}
            />
            <QuickActionButton
              icon={Mail}
              label="Zkontrolovat e-maily"
              description="Communication Agent"
              onClick={() => window.open("/email", "_blank")}
            />
            <QuickActionButton
              icon={Search}
              label="Rešerše"
              description="Research Agent"
              onClick={() => window.open("/knowledge", "_blank")}
            />
            <QuickActionButton
              icon={Power}
              label="Restartovat gateway"
              description="Hermes"
              onClick={() => fetch("http://127.0.0.1:4000/api/hermes/restart", { method: "POST" }).catch(() => {})}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    idle: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
    error: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
    offline: "bg-muted-foreground/40",
  };
  return <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors[status] || colors.offline)} />;
}

function SystemBadge({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string;
  color: "emerald" | "amber" | "rose" | "blue";
}) {
  const colorMap = {
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-400",
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  };
  return (
    <div className={cn("rounded-lg border p-2.5 text-center", colorMap[color])}>
      <Icon className="h-3.5 w-3.5 mx-auto mb-1 opacity-70" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] opacity-70">{label}</p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, total, color, details }: {
  icon: any; label: string; value: number; total?: number; color: string;
  details: { label: string; value: number; color: string }[];
}) {
  const colorBar = {
    violet: "border-l-violet-500",
    amber: "border-l-amber-500",
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
  };
  const colorIcon = {
    violet: "text-violet-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
    emerald: "text-emerald-400",
  };
  return (
    <Card className={cn("border-l-2", colorBar[color as keyof typeof colorBar] || "border-l-primary")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={cn("h-4 w-4", colorIcon[color as keyof typeof colorIcon] || "text-primary")} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          {total != null && <span className="text-sm text-muted-foreground">/ {total}</span>}
        </div>
        {total != null && total > 0 && (
          <Progress value={(value / total) * 100} className="mt-2 h-1.5" />
        )}
        {details.length > 0 && (
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            {details.map(d => (
              <span key={d.label} className="flex items-center gap-1">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  d.color === "emerald" && "bg-emerald-500",
                  d.color === "rose" && "bg-rose-500",
                  d.color === "muted" && "bg-muted-foreground/40",
                )} />
                {d.label}: {d.value}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ icon: Icon, label, description, onClick }: {
  icon: any; label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:border-primary/30 hover:bg-accent/40 transition-all group"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
