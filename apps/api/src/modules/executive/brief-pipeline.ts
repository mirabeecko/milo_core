/**
 * Executive Brief Pipeline — integrovaný ranní briefing.
 * Čte Docker, LLM costs, projekty, ISDS — vše na jednom místě.
 */
import { execSync } from "node:child_process";
import type { AgentManager } from "@milo/agents";
import { getPendingCount, listApprovals } from "./approval-store.js";
import { readRecentEvents } from "./event-logger.js";
import { dockerStatus } from "./docker-monitor.js";
import { prioritizeProjects } from "./project-prioritizer.js";
import { llmCosts } from "./llm-costs.js";
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
  const pendingApprovals = listApprovals("pending");

  // 1. ORGANIZAČNÍ STATUS
  const running = agents.filter((a) => a.status !== "offline");
  const blocked = agents.filter((a) => a.status === "error");
  sections.push({
    title: "Organizační status",
    confidence: "vysoká",
    source: "AgentManager",
    content: `Agentů: ${agents.length} (${running.length} běžících, ${blocked.length} chyb), Misí: ${missions.length}, Schválení: ${getPendingCount()}`,
    priority: 1, blockers: blocked.length ? [`${blocked.length} agentů v chybě`] : [], recommendations: [],
  });
  if (blocked.length) criticalBlockers.push(`${blocked.length} agentů v chybě`);

  // 2. DOCKER
  const docker = dockerStatus();
  sections.push({
    title: "Docker kontejnery",
    confidence: docker.available ? "vysoká" : "nedostupné",
    source: "docker ps",
    content: docker.available
      ? `${docker.healthy}/${docker.total} healthy${docker.unhealthy ? `, ${docker.unhealthy} nezdravých` : ""}`
      : "Docker nedostupný",
    priority: 2,
    blockers: docker.unhealthy ? docker.containers.filter((c) => !c.healthy).map((c) => `Kontejner ${c.name}: ${c.status}`) : [],
    recommendations: [],
  });

  // 3. PROJEKTY
  const proj = prioritizeProjects();
  if (proj.active > 0) {
    sections.push({
      title: "Prioritní projekty",
      confidence: "vysoká",
      source: "milo-os/projects.json",
      content: `Aktivních: ${proj.active}, Dokončených: ${proj.finished}. Top: ${proj.top5.slice(0, 3).map((p) => `${p.name} (${p.reason})`).join(" | ")}`,
      priority: 3, blockers: [], recommendations: proj.top5[0] ? [`Dnes pracovat na: ${proj.top5[0].name}`] : [],
    });
  }

  // 4. LLM NÁKLADY
  const costs = llmCosts();
  sections.push({
    title: "LLM náklady",
    confidence: costs.available ? "střední" : "nízká",
    source: "milo-os/llm_costs.json",
    content: costs.available
      ? `Měsíc: ${costs.monthly.total_czk} Kč. Včera: ${costs.yesterday.calls} volání, ${costs.yesterday.total_czk} Kč. Top model: ${costs.monthly.topModel}`
      : "Data nedostupná (cost_tracker.py neběžel)",
    priority: 5, blockers: [], recommendations: [],
  });

  // 5. GIT
  const git = getGitActivity(repoPath);
  if (git) {
    const intensity = git.commits > 10 ? "vysoká" : git.commits > 3 ? "střední" : "nízká";
    sections.push({
      title: "Vývojová aktivita",
      confidence: "vysoká",
      source: `git log`,
      content: `${git.branch}: ${git.commits} commitů/7d (${intensity}), ${git.filesChanged} změněných souborů. Poslední: ${git.lastCommit}`,
      priority: 4,
      blockers: git.filesChanged > 50 ? [`${git.filesChanged} změněných souborů`] : [],
      recommendations: git.filesChanged > 30 ? ["Zvážit commit"] : [],
    });
  }

  // 6. AKTIVNÍ MISE
  const active = missions.filter((m) => !["completed", "failed"].includes(m.lifecycleStatus));
  sections.push({
    title: "Aktivní mise",
    confidence: "vysoká",
    source: "ExecutiveRuntime",
    content: active.length === 0 ? "žádné" : active.map((m) => `  ${m.id}: "${m.title}" — ${m.lifecycleStatus}`).join("\n"),
    priority: 6, blockers: [], recommendations: active.length === 0 ? ["Vytvořit první misi"] : [],
  });

  // 7. SCHVÁLENÍ
  const highRisk = pendingApprovals.filter((a) => a.risk_level === "critical" || a.risk_level === "high");
  sections.push({
    title: "Čekající schválení",
    confidence: "vysoká",
    source: "Approval Store",
    content: pendingApprovals.length === 0 ? "žádná" : `${pendingApprovals.length} čekajících (${highRisk.length} vysoké riziko)`,
    priority: 3,
    blockers: highRisk.map((a) => `Kritické schválení: ${a.id}`),
    recommendations: pendingApprovals.length > 0 ? ["Zkontrolovat frontu"] : [],
  });
  if (highRisk.length) criticalBlockers.push(`${highRisk.length} kritických schválení`);

  // 8. UDÁLOSTI
  const events = readRecentEvents(15);
  if (events.length) {
    sections.push({
      title: "Poslední události",
      confidence: "vysoká",
      source: "Event Log",
      content: events.slice(0, 5).map((e) => `  [${e.event_type}] ${e.summary || ""}`).join("\n"),
      priority: 8, blockers: [], recommendations: [],
    });
  }

  const allBl = sections.flatMap((s) => s.blockers);
  const allRec = sections.flatMap((s) => s.recommendations);

  return {
    generated: new Date().toISOString(),
    version: "2.0",
    sections: sections.sort((a, b) => a.priority - b.priority),
    summary: [
      `${agents.length} agentů, ${docker.healthy}/${docker.total} kont.`,
      costs.available ? `LLM: ${costs.monthly.total_czk} Kč` : null,
      `${git?.commits || 0} commitů`,
      `${pendingApprovals.length} schválení`,
      criticalBlockers.length ? `${criticalBlockers.length} blokátorů` : "bez blokátorů",
    ].filter(Boolean).join(" | "),
    criticalBlockers: [...new Set([...criticalBlockers, ...allBl])].slice(0, 10),
    topRecommendations: [
      ...new Set([
        ...allRec,
        ...(proj.top5[0] ? [`Prioritní projekt: ${proj.top5[0].name}`] : []),
      ]),
    ].slice(0, 5),
  };
}
