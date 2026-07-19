"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Cpu,
  ShieldAlert,
  Terminal,
  XCircle,
  Zap,
  Clock,
  Target,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useExecutiveMissions,
  useExecutiveApprovals,
  useExecutiveRisks,
  useExecutiveBlockers,
  useExecutiveActivity,
  useExecutiveDepartments,
} from "@/lib/data/executive/use-executive-queries";
import type { Mission, Blocker, Approval, Risk } from "@/lib/data/executive/types";

interface AttentionItem {
  id: string;
  type: "approval" | "blocker" | "failed_mission" | "risk";
  title: string;
  subtitle: string;
  severity: "critical" | "high" | "normal";
  link: string;
  dept?: string;
}

export default function JarvisView() {
  const { data: missions = [] } = useExecutiveMissions();
  const { data: approvals = [] } = useExecutiveApprovals();
  const { data: risks = [] } = useExecutiveRisks();
  const { data: blockers = [] } = useExecutiveBlockers();
  const { data: activity = [] } = useExecutiveActivity();
  const { data: departments = [] } = useExecutiveDepartments();

  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const activeMissions = missions.filter((m) => m.status === "running");
  const completedMissions = missions.filter((m) => m.status === "completed");
  const failedMissions = missions.filter((m) => m.status === "failed");
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const activeBlockers = blockers.filter((b) => b.status === "active");

  const attentionItems: AttentionItem[] = [
    ...pendingApprovals.filter((a) => a.urgency === "critical" || a.urgency === "high")
      .map((a) => ({
        id: a.id,
        type: "approval" as const,
        title: a.title,
        subtitle: `${a.department} · ${a.type} · ${timeAgo(a.createdAt)}`,
        severity: a.urgency === "critical" ? "critical" as const : "high" as const,
        link: "/executive/approvals",
        dept: a.department,
      })),
    ...pendingApprovals.filter((a) => a.urgency !== "critical" && a.urgency !== "high").slice(0, 1)
      .map((a) => ({
        id: a.id,
        type: "approval" as const,
        title: a.title,
        subtitle: `${a.department} · ${a.type}`,
        severity: "normal" as const,
        link: "/executive/approvals",
        dept: a.department,
      })),
    ...activeBlockers.filter((b) => b.severity === "blocking")
      .map((b) => ({
        id: b.id,
        type: "blocker" as const,
        title: b.title,
        subtitle: `${b.department} · since ${shortDate(b.reportedAt)}`,
        severity: b.severity === "blocking" ? "critical" as const : "high" as const,
        link: "/executive/risks",
        dept: b.department,
      })),
    ...failedMissions.slice(0, 2).map((m) => ({
      id: m.id,
      type: "failed_mission" as const,
      title: m.title,
      subtitle: `${m.department ?? "—"} · failed ${timeAgo(m.completedAt ?? m.createdAt)}`,
      severity: "high" as const,
      link: "/executive/missions",
      dept: m.department,
    })),
  ].sort((a, b) => {
    const sev = { critical: 0, high: 1, normal: 2 };
    return (sev[a.severity] ?? 0) - (sev[b.severity] ?? 0);
  });

  const deptMissionCount = (deptId: string) => {
    return missions.filter((m) => m.department?.toLowerCase() === deptId.toLowerCase()).length;
  };

  const meaningfulActivity = activity.filter((a) =>
    a.type === "mission" || a.type === "decision" || a.type === "agent"
  ).slice(0, 12);

  const activeDepts = departments.filter((d) => d.status === "active").length;

  return (
    <div className="-m-6 bg-jarvis-grid min-h-screen text-[#00f0ff]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="jarvis-particle absolute rounded-full bg-[#00f0ff]"
            style={{
              width: `${1.5 + Math.random() * 2}px`, height: `${1.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`, top: `${20 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 6}s`, animationDuration: `${5 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 space-y-5">
        {/* HERO */}
        <div className="relative flex items-center justify-center py-6">
          <div className="absolute">
            <svg width="220" height="220" className="jarvis-scan-ring">
              <circle cx="110" cy="110" r="95" fill="none" stroke="#00f0ff" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.25" />
              <circle cx="110" cy="110" r="95" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="60 160" opacity="0.5" />
            </svg>
          </div>
          <div className="relative text-center z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] jarvis-dot" />
              <span className="text-[9px] font-mono text-[#00f0ff]/40 uppercase tracking-[0.3em]">S Y S T E M &nbsp; O N L I N E</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="jarvis-shimmer">J.A.R.V.I.S.</span>
            </h1>
            <p className="mt-1 text-[10px] font-mono text-[#00f0ff]/30">{time} · {activeMissions.length} active · {completedMissions.length} done · {activeDepts}/{departments.length} depts online</p>
          </div>
        </div>

        {/* ===== FOCUS QUEUE — TOP ATTENTION ===== */}
        {attentionItems.length > 0 && (
          <div className="rounded-xl border border-[#ffaa00]/15 bg-[#ffaa00]/3 backdrop-blur-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-[#ffaa00]" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#ffaa00]/70">Focus Queue</span>
              <span className="font-mono text-[9px] text-[#ffaa00]/30 ml-auto">{attentionItems.length} items</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {attentionItems.slice(0, 6).map((item) => (
                <Link key={item.id} href={item.link} className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-all hover:scale-[1.01]",
                  item.severity === "critical" ? "border-[#ff3344]/30 bg-[#ff3344]/5 hover:bg-[#ff3344]/10" :
                  item.severity === "high" ? "border-[#ffaa00]/20 bg-[#ffaa00]/3 hover:bg-[#ffaa00]/8" :
                  "border-[#00f0ff]/10 bg-transparent hover:bg-[#00f0ff]/5",
                )}>
                  <div className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs",
                    item.severity === "critical" ? "bg-[#ff3344]/20 text-[#ff3344]" :
                    item.severity === "high" ? "bg-[#ffaa00]/20 text-[#ffaa00]" :
                    "bg-[#00f0ff]/10 text-[#00f0ff]",
                  )}>
                    {item.type === "approval" ? "✓" : item.type === "blocker" ? "⊘" : "✕"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-xs font-medium line-clamp-1",
                      item.severity === "critical" ? "text-[#ff3344]" :
                      item.severity === "high" ? "text-[#ffaa00]" : "text-[#00f0ff]/80",
                    )}>{item.title}</p>
                    <p className="font-mono text-[9px] text-[#00f0ff]/25 mt-0.5">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#00f0ff]/20 shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ACTIVE MISSIONS */}
          <div className="jarvis-card-glow rounded-xl border border-[#00f0ff]/10 bg-[#071520]/80 backdrop-blur-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#00f0ff]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff]/70">Active Missions</span>
              <span className="font-mono text-[10px] text-[#00f0ff]/40 ml-auto">{activeMissions.length}</span>
            </div>
            {activeMissions.length === 0 ? (
              <p className="font-mono text-[10px] text-[#00f0ff]/15 py-6 text-center">NO ACTIVE MISSIONS</p>
            ) : (
              <div className="space-y-1">
                {activeMissions.slice(0, 6).map((m) => (
                  <MissionRow key={m.id} mission={m} />
                ))}
              </div>
            )}
            <Link href="/executive/missions" className="flex items-center gap-1 font-mono text-[9px] text-[#00f0ff]/20 hover:text-[#00f0ff]/50 pt-1 transition-colors">
              ALL MISSIONS <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* BLOCKERS */}
          <div className="jarvis-card-glow rounded-xl border border-[#00f0ff]/10 bg-[#071520]/80 backdrop-blur-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className={cn("h-4 w-4", activeBlockers.length > 0 ? "text-[#ff3344]" : "text-[#00f0ff]/40")} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff]/70">Blockers</span>
              <span className={cn("font-mono text-[10px] ml-auto", activeBlockers.length > 0 ? "text-[#ff3344]/70" : "text-[#00ff88]/50")}>
                {activeBlockers.length}
              </span>
            </div>
            {activeBlockers.length === 0 ? (
              <p className="font-mono text-[10px] text-[#00ff88]/20 py-6 text-center">NO ACTIVE BLOCKERS</p>
            ) : (
              <div className="space-y-1">
                {activeBlockers.map((b) => (
                  <div key={b.id} className={cn(
                    "rounded-md border p-2",
                    b.severity === "blocking" ? "border-[#ff3344]/15 bg-[#ff3344]/3" : "border-[#ffaa00]/10 bg-[#ffaa00]/2",
                  )}>
                    <p className="font-mono text-[10px] text-[#00f0ff]/60 line-clamp-1">{b.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[8px] text-[#00f0ff]/25 uppercase">{b.department}</span>
                      <span className={cn("font-mono text-[8px] uppercase", b.severity === "blocking" ? "text-[#ff3344]/50" : "text-[#ffaa00]/40")}>
                        {b.severity}
                      </span>
                      <span className="font-mono text-[8px] text-[#00f0ff]/15 ml-auto">{shortDate(b.reportedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/executive/risks" className="flex items-center gap-1 font-mono text-[9px] text-[#00f0ff]/20 hover:text-[#00f0ff]/50 pt-1 transition-colors">
              ALL RISKS <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* APPROVAL QUEUE */}
          <div className="jarvis-card-glow rounded-xl border border-[#00f0ff]/10 bg-[#071520]/80 backdrop-blur-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn("h-4 w-4", pendingApprovals.length > 0 ? "text-[#ffaa00]" : "text-[#00ff88]/50")} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff]/70">Approvals</span>
              <span className={cn("font-mono text-[10px] ml-auto", pendingApprovals.length > 0 ? "text-[#ffaa00]/70" : "text-[#00ff88]/50")}>
                {pendingApprovals.length} pending
              </span>
            </div>
            {pendingApprovals.length === 0 ? (
              <p className="font-mono text-[10px] text-[#00ff88]/20 py-6 text-center">QUEUE CLEAR</p>
            ) : (
              <div className="space-y-1">
                {pendingApprovals.map((a) => (
                  <div key={a.id} className={cn(
                    "rounded-md border p-2",
                    a.urgency === "critical" ? "border-[#ff3344]/15 bg-[#ff3344]/3" :
                    a.urgency === "high" ? "border-[#ffaa00]/12 bg-[#ffaa00]/2" :
                    "border-[#00f0ff]/8 bg-transparent",
                  )}>
                    <p className={cn(
                      "font-mono text-[10px] line-clamp-1",
                      a.urgency === "critical" ? "text-[#ff3344]/80" :
                      a.urgency === "high" ? "text-[#ffaa00]/70" : "text-[#00f0ff]/50",
                    )}>{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[8px] text-[#00f0ff]/25 uppercase">{a.department} · {a.type}</span>
                      <span className={cn("font-mono text-[8px] uppercase ml-auto",
                        a.urgency === "critical" ? "text-[#ff3344]/50" : "text-[#ffaa00]/40",
                      )}>{a.urgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/executive/approvals" className="flex items-center gap-1 font-mono text-[9px] text-[#00f0ff]/20 hover:text-[#00f0ff]/50 pt-1 transition-colors">
              APPROVAL QUEUE <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ===== SECOND ROW ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* DEPARTMENT PULSE */}
          <div className="jarvis-card-glow rounded-xl border border-[#00f0ff]/10 bg-[#071520]/80 backdrop-blur-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#00f0ff]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff]/70">Department Pulse</span>
            </div>
            <div className="space-y-0.5">
              {departments.map((d) => {
                const isActive = d.status === "active";
                const count = deptMissionCount(d.id);
                return (
                  <div key={d.id} className="flex items-center gap-2.5 py-1.5 border-b border-[#00f0ff]/3 last:border-0">
                    <div className={cn("h-1.5 w-1.5 rounded-full",
                      isActive ? "bg-[#00ff88] animate-pulse" : d.status === "ready" ? "bg-[#ffaa00]/50" : "bg-[#00f0ff]/10",
                    )} />
                    <span className={cn("font-mono text-[10px] uppercase min-w-[4ch]", isActive ? "text-[#00f0ff]/80" : "text-[#00f0ff]/25")}>
                      {d.shortName}
                    </span>
                    <span className="font-mono text-[9px] text-[#00f0ff]/15 flex-1 truncate">{d.domain}</span>
                    {count > 0 && (
                      <span className="font-mono text-[9px] text-[#00f0ff]/30">{count} msn</span>
                    )}
                    <span className={cn("font-mono text-[8px] uppercase", isActive ? "text-[#00ff88]/50" : "text-[#00f0ff]/15")}>
                      {isActive ? "ON" : d.status === "ready" ? "RDY" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RISK RADAR */}
          <div className="jarvis-card-glow rounded-xl border border-[#00f0ff]/10 bg-[#071520]/80 backdrop-blur-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("h-4 w-4", risks.length > 0 ? "text-[#ffaa00]" : "text-[#00f0ff]/40")} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff]/70">Risk Radar</span>
              <span className="font-mono text-[10px] text-[#00f0ff]/40 ml-auto">{risks.length}</span>
            </div>
            {risks.length === 0 ? (
              <p className="font-mono text-[10px] text-[#00ff88]/20 py-6 text-center">NO RISKS TRACKED</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {risks.map((r) => (
                  <RiskRow key={r.id} risk={r} />
                ))}
              </div>
            )}
            <Link href="/executive/risks" className="flex items-center gap-1 font-mono text-[9px] text-[#00f0ff]/20 hover:text-[#00f0ff]/50 pt-1 transition-colors">
              ALL RISKS <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* COMPLETED MISSIONS */}
          <div className="jarvis-card-glow rounded-xl border border-[#00f0ff]/10 bg-[#071520]/80 backdrop-blur-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00ff88]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff]/70">Completed</span>
              <span className="font-mono text-[10px] text-[#00ff88]/50 ml-auto">{completedMissions.length}</span>
            </div>
            {completedMissions.length === 0 ? (
              <p className="font-mono text-[10px] text-[#00f0ff]/15 py-6 text-center">NO COMPLETED MISSIONS</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {completedMissions.slice(0, 8).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 py-1 border-b border-[#00ff88]/3 last:border-0">
                    <CheckCircle2 className="h-3 w-3 text-[#00ff88]/30 shrink-0" />
                    <span className="font-mono text-[9px] text-[#00ff88]/40 truncate flex-1">{m.title}</span>
                    <span className="font-mono text-[8px] text-[#00ff88]/20">{timeAgo(m.completedAt ?? m.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== ACTIVITY TERMINAL ===== */}
        <div className="jarvis-card-glow rounded-xl border border-[#00f0ff]/10 bg-[#071520]/80 backdrop-blur-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#00f0ff]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff]/70">Recent Events</span>
            <span className="font-mono text-[9px] text-[#00f0ff]/20 ml-auto">{meaningfulActivity.length} entries</span>
          </div>
          <div className="font-mono text-[9px] space-y-0 max-h-44 overflow-y-auto">
            {meaningfulActivity.length === 0 ? (
              <p className="text-[#00f0ff]/15 py-6 text-center">NO RECENT EVENTS</p>
            ) : (
              meaningfulActivity.map((item) => {
                const tag = item.type === "mission" ? "MSN" : item.type === "decision" ? "DEC" : item.type === "agent" ? "AGT" : "SYS";
                return (
                  <div key={item.id} className="flex items-center gap-2 py-1 border-b border-[#00f0ff]/2 last:border-0">
                    <span className="text-[#00f0ff]/15 shrink-0">{formatLogTime(item.timestamp)}</span>
                    <span className="text-[#00f0ff]/25 w-8 shrink-0">{tag}</span>
                    <span className="text-[#00f0ff]/30 truncate">{item.title}</span>
                    {item.department && <span className="text-[#00f0ff]/10 text-[8px] ml-auto">{item.department}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-center font-mono text-[8px] text-[#00f0ff]/10 pb-6">
          J.A.R.V.I.S. · MiLO Core v0.1 · Just A Rather Very Intelligent System
        </div>
      </div>
    </div>
  );
}

function MissionRow({ mission }: { mission: Mission }) {
  const elapsed = mission.startedAt ? timeAgo(mission.startedAt) : null;
  return (
    <div className="rounded-md border border-[#00f0ff]/8 p-2 hover:bg-[#00f0ff]/3 transition-colors">
      <div className="flex items-start gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] mt-1.5 shrink-0 animate-pulse" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] text-[#00f0ff]/70 line-clamp-1">{mission.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {mission.department && <span className="font-mono text-[8px] text-[#00f0ff]/30 uppercase">{mission.department}</span>}
            <span className={cn("font-mono text-[8px] uppercase",
              mission.priority === "critical" ? "text-[#ff3344]/50" : mission.priority === "high" ? "text-[#ffaa00]/50" : "text-[#00f0ff]/25",
            )}>{mission.priority}</span>
            {elapsed && <span className="font-mono text-[8px] text-[#00f0ff]/20 ml-auto">{elapsed}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskRow({ risk }: { risk: Risk }) {
  const isHigh = risk.probability === "Vysoká" || risk.impact === "Kritický" || risk.impact === "Vysoký";
  return (
    <div className={cn("rounded-md border p-2", isHigh ? "border-[#ffaa00]/12 bg-[#ffaa00]/2" : "border-[#00f0ff]/5")}>
      <p className={cn("font-mono text-[9px] line-clamp-1", isHigh ? "text-[#ffaa00]/60" : "text-[#00f0ff]/30")}>
        {risk.description}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn("font-mono text-[7px] uppercase", isHigh ? "text-[#ffaa00]/40" : "text-[#00f0ff]/15")}>
          P: {risk.probability}
        </span>
        <span className={cn("font-mono text-[7px] uppercase", isHigh ? "text-[#ff3344]/40" : "text-[#00f0ff]/15")}>
          I: {risk.impact}
        </span>
        <span className="font-mono text-[7px] text-[#00f0ff]/10 ml-auto truncate max-w-[50%]">{risk.mitigation.slice(0, 40)}</span>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  } catch { return "—"; }
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
  } catch { return "—"; }
}

function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return "--:--:--"; }
}
