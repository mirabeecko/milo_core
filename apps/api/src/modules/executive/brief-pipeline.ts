/**
 * Executive Brief Pipeline — přímý přístup k datům (ne HTTP).
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentManager } from "@milo/agents";
import { getPendingCount, listApprovals } from "./approval-store.js";
import { readRecentEvents } from "./event-logger.js";
import type { ExecutiveMission } from "./executive-runtime.js";

export type Confidence = "vysoká" | "střední" | "nízká" | "nedostupné";

export interface BriefSection {
  title: string;
  confidence: Confidence;
  source: string;
  content: string;
  priority: number;
  blockers: string[];
  recommendations: string[];
}

export interface ExecutiveBrief {
  generated: string;
  version: string;
  sections: BriefSection[];
  summary: string;
  criticalBlockers: string[];
  topRecommendations: string[];
}

function getGitActivity(repoPath: string) {
  try {
    const log = execSync(`cd "${repoPath}" && git log --oneline --since="7 days ago" 2>/dev/null | wc -l`, { encoding: "utf-8" }).trim();
    const branch = execSync(`cd "${repoPath}" && git branch --show-current 2>/dev/null`, { encoding: "utf-8" }).trim();
    const lastCommit = execSync(`cd "${repoPath}" && git log -1 --format="%s" 2>/dev/null`, { encoding: "utf-8" }).trim();
    const diffStat = execSync(`cd "${repoPath}" && git diff --stat HEAD 2>/dev/null | tail -1`, { encoding: "utf-8" }).trim();
    const filesMatch = diffStat.match(/(\d+) files? changed/);
    return { commits: parseInt(log) || 0, filesChanged: filesMatch ? parseInt(filesMatch[1]) : 0, branch, lastCommit };
  } catch { return null; }
}

export function generateExecutiveBrief(
  repoPath: string,
  manager: AgentManager,
  execMissions?: ExecutiveMission[],
): ExecutiveBrief {
  const sections: BriefSection[] = [];
  const criticalBlockers: string[] = [];
  const agents = manager.listAgents().map((a) => ({ id: a.agent.id, name: a.agent.name, status: a.agent.status }));
  const missions = execMissions || [];
  const pendingCount = getPendingCount();
  const pendingApprovals = listApprovals("pending");
  const recentEvents = readRecentEvents(30);

  // 1. ORGANIZAČNÍ STATUS (přímý přístup k AgentManageru)
  const runningAgents = agents.filter((a) => a.status !== "offline");
  const blockedAgents = agents.filter((a) => a.status === "error");
  const deptMap = new Map<string, number>();
  agents.forEach((a) => {
    const dept = (a as any).department || "unknown";
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });

  sections.push({
    title: "Organizační status",
    confidence: "vysoká",
    source: "AgentManager (přímý přístup)",
    content: [
      `Agenti celkem: ${agents.length} (${runningAgents.length} běžících, ${blockedAgents.length} v chybě)`,
      `Oddělení: ${deptMap.size}`,
      `Aktivní mise: ${missions.filter((m) => !["completed", "failed"].includes(m.lifecycleStatus)).length}`,
      `Čekající schválení: ${pendingCount}`,
      ...agents.filter((a) => a.status === "error").map((a) => `  ⚠️ ${a.name}: error`),
    ].join("\n"),
    priority: 1,
    blockers: blockedAgents.length > 0 ? [`${blockedAgents.length} agentů v chybovém stavu`] : [],
    recommendations: pendingCount > 0 ? ["Zkontrolovat frontu schválení"] : [],
  });
  if (blockedAgents.length > 0) criticalBlockers.push(`${blockedAgents.length} agentů v chybě`);

  // 2. GIT AKTIVITA
  const git = getGitActivity(repoPath);
  if (git) {
    const intensity = git.commits > 10 ? "vysoká" : git.commits > 3 ? "střední" : "nízká";
    sections.push({
      title: "Vývojová aktivita",
      confidence: "vysoká",
      source: `git log (${repoPath})`,
      content: `Branch: ${git.branch}\nCommitů za 7 dní: ${git.commits} (${intensity} aktivita)\nZměněných souborů (unstaged): ${git.filesChanged}\nPoslední commit: ${git.lastCommit}`,
      priority: 2,
      blockers: git.filesChanged > 50 ? [`${git.filesChanged} změněných souborů — riziko konfliktů`] : [],
      recommendations: git.filesChanged > 50 ? ["Zvážit commit a push před další prací"] : [],
    });
  }

  // 3. AKTIVNÍ MISE
  const active = missions.filter((m) => !["completed", "failed"].includes(m.lifecycleStatus));
  const blocked = missions.filter((m) => m.lifecycleStatus === "blocked");
  sections.push({
    title: "Aktivní mise",
    confidence: "vysoká",
    source: "ExecutiveRuntime",
    content: active.length === 0
      ? "žádné aktivní mise"
      : active.map((m) => `  ${m.id}: "${m.title}" — ${m.lifecycleStatus} (${m.department || "?"})`).join("\n"),
    priority: 3,
    blockers: blocked.map((m) => `Mise ${m.id} blokována: ${m.title}`),
    recommendations: active.length === 0 ? ["Vytvořit první misi: POST /executive/demo/full-mission"] : [],
  });

  // 4. SCHVÁLENÍ
  sections.push({
    title: "Čekající schválení",
    confidence: "vysoká",
    source: "Approval Store",
    content: pendingApprovals.length === 0
      ? "žádná čekající schválení"
      : pendingApprovals.map((a) => `  ${a.id}: ${a.what} (riziko: ${a.risk_level}, od ${a.requested_at.slice(0, 10)})`).join("\n"),
    priority: 2,
    blockers: pendingApprovals.filter((a) => a.risk_level === "critical" || a.risk_level === "high").map((a) => `Kritické schválení: ${a.id}`),
    recommendations: pendingApprovals.length > 0 ? ["Schválit nebo zamítnout čekající položky"] : [],
  });
  if (pendingApprovals.length > 0) criticalBlockers.push(`${pendingApprovals.length} čekajících schválení`);

  // 5. POSLEDNÍ UDÁLOSTI
  if (recentEvents.length > 0) {
    sections.push({
      title: "Poslední události",
      confidence: "vysoká",
      source: "Event Log (JSONL)",
      content: recentEvents.slice(0, 8).map((e) => `  [${e.event_type}] ${e.summary || ""}`).join("\n"),
      priority: 4,
      blockers: [],
      recommendations: [],
    });
  }

  // 6. INTEGRACE
  const integrations = [
    { name: "ISDS (Datové schránky)", available: existsSync(resolve(repoPath, "../MiLO_ISDS_MCP")) },
    { name: "n8n", available: existsSync(resolve(repoPath, "../n8n")) },
    { name: "Obsidian vault", available: !!process.env.OBSIDIAN_VAULT_PATH },
  ];
  sections.push({
    title: "Dostupné integrace",
    confidence: "vysoká",
    source: "Souborový systém",
    content: integrations.map((i) => `  ${i.available ? "✅" : "⚠️"} ${i.name}: ${i.available ? "dostupné" : "nedostupné"}`).join("\n"),
    priority: 5,
    blockers: [],
    recommendations: [],
  });

  const allBlockers = sections.flatMap((s) => s.blockers);
  const allRecs = sections.flatMap((s) => s.recommendations);

  return {
    generated: new Date().toISOString(),
    version: "1.0",
    sections: sections.sort((a, b) => a.priority - b.priority),
    summary: `MiLO Executive Brief: ${active.length} aktivních misí, ${pendingCount} čekajících schválení, ${git?.commits || 0} commitů za 7 dní. ${criticalBlockers.length > 0 ? `⚠️ ${criticalBlockers.length} blokátorů.` : "✅ Bez blokátorů."}`,
    criticalBlockers: [...new Set([...criticalBlockers, ...allBlockers])].slice(0, 10),
    topRecommendations: [...new Set([...allRecs, ...(criticalBlockers.length > 0 ? ["Řešit blokátory"] : ["Pokračovat v aktivaci KNOW, COMM, ARCH"])])].slice(0, 5),
  };
}
