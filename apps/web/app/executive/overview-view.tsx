"use client";

import Link from "next/link";
import {
  Building2,
  Bot,
  AlertTriangle,
  ShieldAlert,
  ClipboardCheck,
  Activity,
  GitBranch,
  FileText,
  ScrollText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
  Radio,
  Gauge,
  Users,
  Target,
  Layers,
  CircleDot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ExecutiveOverview,
  Department,
  Mission,
  Decision,
  Risk,
  Blocker,
  Approval,
  ActivityItem,
} from "@/lib/data/executive";

interface Props {
  overview: ExecutiveOverview;
  departments: Department[];
  missions: Mission[];
  decisions: Decision[];
  risks: Risk[];
  blockers: Blocker[];
  approvals: Approval[];
  activity: ActivityItem[];
}

const deptColors: Record<string, string> = {
  oc: "bg-primary/10 text-primary border-primary/30",
  arch: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  eng: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  know: "bg-violet-500/10 text-violet-500 border-violet-500/30",
  comm: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  ops: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  qa: "bg-rose-500/10 text-rose-500 border-rose-500/30",
};

const deptIcons: Record<string, React.ElementType> = {
  oc: Target,
  arch: Building2,
  eng: Zap,
  know: Layers,
  comm: Users,
  ops: ShieldAlert,
  qa: Gauge,
};

const activityTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  git: { icon: GitBranch, color: "bg-emerald-500/10 text-emerald-500" },
  document: { icon: FileText, color: "bg-primary/10 text-primary" },
  decision: { icon: ScrollText, color: "bg-amber-500/10 text-amber-500" },
  mission: { icon: Bot, color: "bg-blue-500/10 text-blue-500" },
  agent: { icon: Bot, color: "bg-violet-500/10 text-violet-500" },
  system: { icon: ShieldAlert, color: "bg-rose-500/10 text-rose-500" },
};

export function DailyCommandCenterView({
  overview,
  departments,
  missions,
  decisions,
  risks,
  blockers,
  approvals,
  activity,
}: Props) {
  const today = new Date().toLocaleDateString("cs-CZ", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const failedMissions = missions.filter((m) => m.status === "failed");
  const activeMissions = missions.filter((m) => m.status === "running");
  const completedMissions = missions.filter((m) => m.status === "completed");
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const urgentApprovals = pendingApprovals.filter((a) => a.urgency === "critical" || a.urgency === "high");
  const activeBlockers = blockers.filter((b) => b.status === "active");
  const blockingBlockers = activeBlockers.filter((b) => b.severity === "blocking");
  const criticalRisks = risks.filter((r) => r.probability === "Vysoká" || r.impact === "Kritický" || r.impact === "Vysoký");
  const activeDepts = departments.filter((d) => d.status === "active");
  const gitActivity = activity.filter((a) => a.type === "git").slice(0, 6);

  const needsAttention = (blockingBlockers.length + urgentApprovals.length + failedMissions.length + criticalRisks.length);
  const attentionLevel = needsAttention === 0 ? "low" : needsAttention <= 3 ? "normal" : needsAttention <= 6 ? "elevated" : "critical";

  function briefText(): string {
    const parts: string[] = [];
    if (activeMissions.length > 0) parts.push(`${activeMissions.length} active missions`);
    if (completedMissions.length > 0) parts.push(`${completedMissions.length} completed missions`);
    if (pendingApprovals.length > 0) parts.push(`${pendingApprovals.length} pending approvals${urgentApprovals.length > 0 ? ` (${urgentApprovals.length} urgent)` : ""}`);
    if (activeBlockers.length > 0) parts.push(`${activeBlockers.length} active blockers (${blockingBlockers.length} blocking)`);
    if (risks.length > 0) parts.push(`${risks.length} monitored risks`);
    if (decisions.length > 0) parts.push(`${decisions.length} architecture decisions`);
    if (activeDepts.length > 0) parts.push(`${activeDepts.length}/${departments.length} departments active`);
    if (parts.length === 0) return "All systems nominal. No items requiring attention.";
    return parts.join(" · ");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 p-5 md:p-7 shadow-sm"
        style={{
          background: attentionLevel === "critical"
            ? "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(0 70% 30% / 0.12) 40%, hsl(30 70% 30% / 0.04) 100%)"
            : "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(262 70% 50% / 0.08) 40%, hsl(220 70% 50% / 0.04) 100%)",
        }}
      >
        <div className="absolute inset-0 bg-dot-pattern opacity-50" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "flex h-2.5 w-2.5 rounded-full animate-pulse",
                    attentionLevel === "critical" ? "bg-rose-500" : attentionLevel === "elevated" ? "bg-amber-500" : "bg-emerald-500",
                  )} />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Command Center</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                <span className="text-gradient">MiLO Daily</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{today}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className={cn(
                "text-xs gap-1.5",
                attentionLevel === "critical" ? "border-rose-500/40 text-rose-500" :
                attentionLevel === "elevated" ? "border-amber-500/40 text-amber-500" :
                "border-emerald-500/40 text-emerald-500",
              )}>
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  attentionLevel === "critical" ? "bg-rose-500" : attentionLevel === "elevated" ? "bg-amber-500" : "bg-emerald-500",
                )} />
                {attentionLevel === "critical" ? "Critical" : attentionLevel === "elevated" ? "Elevated" : "Normal"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {new Date(overview.generatedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            </div>
          </div>

          {/* Status strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              <span className="font-medium text-foreground">{activeMissions.length}</span> active
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <ClipboardCheck className={cn("h-3 w-3", pendingApprovals.length > 0 && "text-amber-500")} />
              <span className={cn("font-medium", pendingApprovals.length > 0 ? "text-amber-500" : "text-foreground")}>{pendingApprovals.length}</span> pending
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <ShieldAlert className={cn("h-3 w-3", activeBlockers.length > 0 && "text-rose-500")} />
              <span className={cn("font-medium", activeBlockers.length > 0 ? "text-rose-500" : "text-foreground")}>{activeBlockers.length}</span> blockers
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="font-medium text-emerald-500">{completedMissions.length}</span> completed
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span className="font-medium text-foreground">{decisions.length}</span> ADRs
            </span>
          </div>

          {/* Attention bar — only when something needs attention */}
          {needsAttention > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {urgentApprovals.length > 0 && (
                <Link href="/executive/approvals" className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 hover:bg-rose-500/10 transition-colors">
                  <ClipboardCheck className="h-4 w-4 text-rose-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-rose-500">{urgentApprovals.length} urgent approval{urgentApprovals.length > 1 ? "s" : ""}</p>
                    <p className="text-[10px] text-rose-500/70 truncate">{urgentApprovals[0]?.title}</p>
                  </div>
                </Link>
              )}
              {blockingBlockers.length > 0 && (
                <Link href="/executive/risks" className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 hover:bg-rose-500/10 transition-colors">
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-rose-500">{blockingBlockers.length} blocking</p>
                    <p className="text-[10px] text-rose-500/70 truncate">{blockingBlockers[0]?.title}</p>
                  </div>
                </Link>
              )}
              {criticalRisks.length > 0 && (
                <Link href="/executive/risks" className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 hover:bg-amber-500/10 transition-colors">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-amber-500">{criticalRisks.length} critical risk{criticalRisks.length > 1 ? "s" : ""}</p>
                    <p className="text-[10px] text-amber-500/70 truncate">{criticalRisks[0]?.description.slice(0, 40)}</p>
                  </div>
                </Link>
              )}
              {failedMissions.length > 0 && (
                <Link href="/executive/missions" className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 hover:bg-amber-500/10 transition-colors">
                  <XCircle className="h-4 w-4 text-amber-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-amber-500">{failedMissions.length} failed</p>
                    <p className="text-[10px] text-amber-500/70 truncate">{failedMissions[0]?.title}</p>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main grid: 3 columns */}
      <div className="grid gap-4 md:gap-4 grid-cols-1 lg:grid-cols-3">
        {/* EXECUTIVE BRIEF */}
        <Card className="lg:row-span-2 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Executive Brief
            </CardTitle>
            <CardDescription className="text-xs">Auto-generated daily summary</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Status</p>
              <p className="text-sm leading-relaxed">{briefText()}</p>
            </div>

            {overview.bootstrap.status && (
              <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-medium text-primary uppercase tracking-wider">Bootstrap</p>
                <p className="text-xs text-muted-foreground">{overview.bootstrap.status}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className="text-lg font-bold">{activeMissions.length + completedMissions.length + failedMissions.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Missions</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className="text-lg font-bold"><DeptCounts departments={departments} /></p>
                <p className="text-[10px] text-muted-foreground">Active / Total</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-500">{completedMissions.length}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg border border-border p-2.5 text-center">
                <p className={cn("text-lg font-bold", failedMissions.length > 0 ? "text-rose-500" : "text-muted-foreground")}>{failedMissions.length}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex flex-col gap-1">
              {pendingApprovals.length > 0 && (
                <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs" asChild>
                  <Link href="/executive/approvals">
                    <ClipboardCheck className="h-3.5 w-3.5 text-amber-500" />
                    {pendingApprovals.length} Approvals Waiting
                  </Link>
                </Button>
              )}
              {activeMissions.length > 0 && (
                <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs" asChild>
                  <Link href="/executive/missions">
                    <Bot className="h-3.5 w-3.5" />
                    View Active Missions
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs" asChild>
                <Link href="/executive/activity">
                  <Activity className="h-3.5 w-3.5" />
                  Full Timeline
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ACTIVE MISSIONS */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Missions
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/executive/missions">All <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-1.5">
            {[...activeMissions, ...failedMissions, ...completedMissions.slice(0, 2)].slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-2 rounded-md border border-border/50 p-2.5 hover:bg-accent/30 transition-colors"
              >
                {m.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />}
                {m.status === "failed" && <XCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />}
                {m.status === "running" && <CircleDot className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0 animate-pulse" />}
                {m.status === "pending" && <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{m.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1", m.priority === "critical" && "text-rose-500 border-rose-500/30", m.priority === "high" && "text-amber-500 border-amber-500/30")}>
                      {m.priority}
                    </Badge>
                    {m.department && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1">{m.department}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {missions.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Bot className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No missions recorded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DEPARTMENT HEALTH */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Departments
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/executive/departments">All <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {departments.map((dept) => {
              const Icon = deptIcons[dept.id] ?? Building2;
              const isActive = dept.status === "active";
              return (
                <div key={dept.id} className="flex items-center gap-2.5 rounded-md p-2 hover:bg-accent/30 transition-colors">
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    deptColors[dept.id] ?? "bg-muted text-muted-foreground",
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{dept.shortName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{dept.domain}</p>
                  </div>
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isActive ? "bg-emerald-500" : dept.status === "ready" ? "bg-amber-500" : "bg-muted-foreground/30",
                  )} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* PENDING APPROVALS */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className={cn("h-4 w-4", pendingApprovals.length > 0 ? "text-amber-500" : "text-muted-foreground")} />
                Approvals
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/executive/approvals">All <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-1.5">
            {pendingApprovals.slice(0, 4).map((a) => (
              <div key={a.id} className={cn(
                "rounded-md border p-2.5",
                a.urgency === "critical" ? "border-rose-500/20 bg-rose-500/5" :
                a.urgency === "high" ? "border-amber-500/20 bg-amber-500/5" :
                "border-border/50",
              )}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium line-clamp-2">{a.title}</p>
                  <Badge variant="outline" className={cn(
                    "text-[9px] h-4 px-1 shrink-0",
                    a.urgency === "critical" && "text-rose-500 border-rose-500/30",
                    a.urgency === "high" && "text-amber-500 border-amber-500/30",
                  )}>
                    {a.urgency}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">{a.department}</Badge>
                  <span className="text-[9px] text-muted-foreground">{a.type}</span>
                </div>
              </div>
            ))}
            {pendingApprovals.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <CheckCircle2 className="h-6 w-6 text-emerald-500/40" />
                <p className="text-xs text-muted-foreground">No pending approvals</p>
                <p className="text-[10px] text-muted-foreground text-center">All clear</p>
              </div>
            )}
            {/* Approved quick view */}
            {approvals.filter((a) => a.status === "approved").slice(0, 2).map((a) => (
              <div key={a.id} className="rounded-md border border-emerald-500/10 bg-emerald-500/5 p-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.title}</p>
                  <span className="text-[9px] text-emerald-500/70 shrink-0 ml-auto">approved</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* RISKS & BLOCKERS */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className={cn("h-4 w-4", (risks.length > 0 || activeBlockers.length > 0) ? "text-amber-500" : "text-muted-foreground")} />
                Risks & Blockers
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/executive/risks">All <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-1.5">
            {activeBlockers.slice(0, 3).map((b) => (
              <div key={b.id} className={cn(
                "rounded-md border p-2.5",
                b.severity === "blocking" ? "border-rose-500/20 bg-rose-500/5" : "border-amber-500/10 bg-amber-500/5",
              )}>
                <div className="flex items-start gap-2">
                  <ShieldAlert className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", b.severity === "blocking" ? "text-rose-500" : "text-amber-500")} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{b.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-[9px] h-4 px-1">{b.department}</Badge>
                      <Badge variant="outline" className={cn(
                        "text-[9px] h-4 px-1",
                        b.severity === "blocking" ? "text-rose-500 border-rose-500/30" : "text-amber-500 border-amber-500/30",
                      )}>
                        {b.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {activeBlockers.length === 0 && risks.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <CheckCircle2 className="h-6 w-6 text-emerald-500/40" />
                <p className="text-xs text-muted-foreground">No active risks</p>
              </div>
            )}
            {criticalRisks.slice(0, 2).map((r) => (
              <div key={r.id} className="rounded-md border border-amber-500/10 bg-amber-500/5 p-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs line-clamp-2">{r.description}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] text-amber-500">{r.probability}</span>
                      <span className="text-[9px] text-muted-foreground">impact: {r.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* LATEST ACTIVITY / GIT */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Latest Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/executive/activity">All <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-1">
            {[mergeActivity(activity, missions, approvals)].flatMap((items) => items.slice(0, 6)).map((item) => {
              const config = activityTypeConfig[item.type] ?? activityTypeConfig.system;
              const Icon = config.icon;
              return (
                <div key={item.id} className="flex gap-2 rounded-md p-2 hover:bg-accent/30 transition-colors">
                  <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded", config.color)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-muted-foreground">{item.actor}</span>
                      {item.department && (
                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1">{item.department}</Badge>
                      )}
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        {formatTimelineDate(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {activity.length === 0 && missions.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Activity className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer: Source line */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pb-2">
        <span>
          {attentionLevel !== "low"
            ? `${needsAttention} items requiring attention`
            : "All systems nominal"}
        </span>
        <span>Data: {activity.length > 0 ? "live API + git" : "file-based"} · Generated {new Date(overview.generatedAt).toLocaleTimeString("cs-CZ")}</span>
      </div>
    </div>
  );
}

function DeptCounts({ departments }: { departments: Department[] }): string {
  const active = departments.filter((d) => d.status === "active").length;
  return `${active}/${departments.length}`;
}

function mergeActivity(activity: ActivityItem[], missions: Mission[], approvals: Approval[]): ActivityItem[] {
  const missionItems: ActivityItem[] = missions.slice(0, 3).map((m) => ({
    id: `ms-${m.id}`,
    type: "mission" as const,
    title: m.title,
    description: `Status: ${m.status} · Priority: ${m.priority}`,
    timestamp: m.completedAt ?? m.startedAt ?? m.createdAt,
    actor: m.ownerName,
    department: m.department,
  }));

  const approvalItems: ActivityItem[] = approvals.filter((a) => a.status !== "pending").slice(0, 2).map((a) => ({
    id: `ap-${a.id}`,
    type: "decision" as const,
    title: a.title,
    description: `${a.status} · ${a.department}`,
    timestamp: a.createdAt,
    actor: "Board",
    department: a.department,
  }));

  return [...missionItems, ...approvalItems, ...activity].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function formatTimelineDate(iso: string): string {
  try {
    const now = new Date();
    const d = new Date(iso);
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);

    if (diffHrs < 1) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffHrs < 48) return "yesterday";
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
  } catch {
    return iso;
  }
}
