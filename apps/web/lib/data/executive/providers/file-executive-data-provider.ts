import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import type {
  ExecutiveOverview,
  Mission,
  Department,
  Artifact,
  Decision,
  Risk,
  Blocker,
  Approval,
  ActivityItem,
} from "../types";
import type { ExecutiveDataProvider } from "../provider-interface";

const MOCKS_DIR = "/Users/mb/dev/MiLO_Core/apps/api/data";
const DOCS_DIR = "/Users/mb/dev/MiLO_Core/docs";
const BOARD_DIR = join(DOCS_DIR, "board");
const ADR_DIR = join(DOCS_DIR, "adr");
const ROOT_DIR = "/Users/mb/dev/MiLO_Core";

function tryRead(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function tryReadDir(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function parseMissionJson(raw: unknown[]): Mission[] {
  return raw.map((m, i: number) => {
    const item = m as Record<string, unknown>;
    return {
      id: (item.id as string) ?? `mission-${i}`,
      title: (item.title as string) ?? "Untitled",
      description: (item.description as string) ?? "",
      status: (item.status as Mission["status"]) ?? "pending",
      priority: (item.priority as Mission["priority"]) ?? "normal",
      ownerId: (item.ownerId as string) ?? "unknown",
      ownerName: (item.ownerId as string) === "chief-of-staff" ? "Chief of Staff" : (item.ownerId as string),
      department: "OC",
      createdAt: (item.createdAt as string) ?? "",
      startedAt: item.startedAt as string | undefined,
      completedAt: item.completedAt as string | undefined,
      result: item.result as Mission["result"],
    };
  });
}

function parseBacklogMarkdown(content: string): {
  items: Array<{ id: string; title: string; department: string; effort: string; status: string; priority: string }>;
  activeMissions: Array<{ id: string; title: string; owner: string; status: string }>;
} {
  const items: Array<{ id: string; title: string; department: string; effort: string; status: string; priority: string }> = [];
  const activeMissions: Array<{ id: string; title: string; owner: string; status: string }> = [];

  const lines = content.split("\n");
  let currentPriority = "";
  let inActiveSection = false;

  for (const line of lines) {
    if (line.startsWith("## Priorita 0")) { currentPriority = "P0"; continue; }
    if (line.startsWith("## Priorita 1")) { currentPriority = "P1"; continue; }
    if (line.startsWith("## Priorita 2")) { currentPriority = "P2"; continue; }
    if (line.startsWith("## Priorita 3")) { currentPriority = "P3"; continue; }
    if (line.startsWith("## Nově navržené") || line.startsWith("## New")) { currentPriority = "N"; continue; }
    if (line.startsWith("## Mise v průběhu") || line.startsWith("## Active Missions")) { inActiveSection = true; currentPriority = ""; continue; }
    if (line.startsWith("---") && inActiveSection) { inActiveSection = false; continue; }

    if (currentPriority && line.startsWith("|") && !line.includes("---") && !line.includes("ID |")) {
      const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 6) {
        items.push({
          id: cols[0] ?? "",
          title: cols[1] ?? "",
          department: cols[2] ?? "",
          effort: cols[3] ?? "",
          status: cols[cols.length - 1] ?? "",
          priority: currentPriority,
        });
      }
    }

    if (inActiveSection && line.startsWith("|") && !line.includes("---") && !line.includes("ID |")) {
      const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 4 && cols[0] !== "—") {
        activeMissions.push({
          id: cols[0] ?? "",
          title: cols[1] ?? "",
          owner: cols[2] ?? "",
          status: cols[3] ?? "",
        });
      }
    }
  }

  return { items, activeMissions };
}

function parseDepartments(content: string): Department[] {
  const departments: Department[] = [];

  const sections = content.split(/^###?\s+\d+\.\d+\s+/gm);
  const headers = content.match(/^###?\s+\d+\.\d+\s+(.+)$/gm) ?? [];

  for (const header of headers) {
    const name = header.replace(/^###?\s+\d+\.\d+\s+/, "").trim();
    if (name === "Office of the Chief (OC)" || name.includes("OC") || name.includes("Office of the Chief")) {
      departments.push(createDepartment("oc", "Office of the Chief", "OC", "Strategie, koordinace, rozhraní k Vlastníkovi", "Zajistit, aby MiLO jako celek naplňoval Ústavu a sloužil Vlastníkovi.", 0));
    }
  }

  departments.push(
    createDepartment("oc", "Office of the Chief", "OC", "Strategie, koordinace, rozhraní k Vlastníkovi", "Zajistit, aby MiLO jako celek naplňoval Ústavu a sloužil Vlastníkovi.", 0),
    createDepartment("arch", "Architecture", "ARCH", "Systémový návrh, ADR, technické standardy", "Zajistit, aby technická architektura MiLO byla v souladu s Ústavou a aby každá komponenta zůstala nahraditelná.", 0),
    createDepartment("eng", "Engineering", "ENG", "Vývoj, údržba, nasazení softwaru", "Stavět, udržovat a nasazovat software MiLO podle architektonické specifikace.", 1),
    createDepartment("know", "Knowledge", "KNOW", "Paměť, učení, dokumenty, vyhledávání", "Zajistit, že co bylo jednou zjištěno, je znovu použitelné. Udržovat organizační paměť.", 0),
    createDepartment("comm", "Communications", "COMM", "Externí kanály, zprávy, notifikace", "Spravovat všechny externí komunikační kanály mezi MiLO a světem.", 0),
    createDepartment("ops", "Operations", "OPS", "Infrastruktura, monitoring, zálohování", "Udržet MiLO v chodu — spolehlivě, bezpečně, efektivně.", 1),
    createDepartment("qa", "Quality", "QA", "Testování, revize, metrika, standardy", "Zajistit, že každá komponenta MiLO splňuje standardy kvality.", 2),
  );

  return departments;
}

function createDepartment(
  id: string,
  name: string,
  shortName: string,
  domain: string,
  missionStatement: string,
  bootstrapWave: number,
): Department {
  const kpis: Record<string, Array<{ metric: string; target: string }>> = {
    oc: [
      { metric: "Vlastníkova spokojenost", target: "≥ 4/5" },
      { metric: "Míra eskalací na OC", target: "≤ 5 %" },
      { metric: "Rozpočtová přesnost", target: "≤ 15 %" },
      { metric: "Doba odezvy na eskalaci", target: "≤ 4 hodiny" },
    ],
    arch: [
      { metric: "ADRs approved", target: "6" },
      { metric: "Architektonický dluh", target: "0" },
    ],
    eng: [
      { metric: "Test coverage", target: "≥ 80 %" },
      { metric: "Incident rate", target: "Klesající" },
    ],
    know: [
      { metric: "Doba vyhledání", target: "≤ 5 sekund" },
      { metric: "Znovupoužití znalostí", target: "Rostoucí" },
    ],
    comm: [
      { metric: "Doba doručení zprávy", target: "≤ 30 sekund" },
      { metric: "Dostupnost kanálů", target: "≥ 99.5 %" },
    ],
    ops: [
      { metric: "Uptime", target: "≥ 99.5 %" },
      { metric: "RPO", target: "≤ 1 hodina" },
      { metric: "RTO", target: "≤ 4 hodiny" },
    ],
    qa: [
      { metric: "Chybovost v produkci", target: "Klesající" },
      { metric: "Regrese", target: "0" },
    ],
  };

  const responsibilities: Record<string, string[]> = {
    oc: ["Definovat strategické cíle", "Alokovat rozpočet", "Reprezentovat MiLO vůči Vlastníkovi", "Řešit konflikty mezi odděleními"],
    arch: ["Udržovat ARCHITECTURE.md", "Spravovat ADR proces", "Definovat technické standardy", "Schvalovat architektonické změny"],
    eng: ["Implementovat software podle ARCH specifikace", "Udržovat existující kód", "Spravovat CI/CD", "Dodržovat coding standards"],
    know: ["Spravovat znalostní bázi", "Indexovat dokumenty", "Udržovat Konceptuální model", "Spravovat paměťové backendy"],
    comm: ["Spravovat Telegram bota", "Spravovat hlasové rozhraní", "Spravovat emailovou komunikaci", "Udržovat dashboard"],
    ops: ["Spravovat infrastrukturu", "Monitorovat health", "Zajišťovat zálohování", "Spravovat nasazení"],
    qa: ["Definovat testovací strategii", "Provádět code review", "Měřit metriky kvality", "Blokovat nekvalitní nasazení"],
  };

  const boundaries: Record<string, string[]> = {
    oc: ["Nesmí řídit jednotlivé mise", "Nesmí rozhodovat o technické implementaci", "Nesmí měnit Ústavu bez ratifikace Vlastníkem"],
    arch: ["Nesmí implementovat", "Nesmí blokovat změnu bez ADR"],
    eng: ["Nesmí měnit architekturu bez ADR", "Nesmí nasazovat bez QA a OPS"],
    know: ["Nesmí mazat znalosti bez schválení", "Nesmí rozhodovat o důležitosti"],
    comm: ["Nesmí číst soukromé zprávy Vlastníka", "Nesmí odeslat neschválenou zprávu"],
    ops: ["Nesmí měnit kód", "Nesmí měnit architekturu", "Nesmí číst obsah dat"],
    qa: ["Nesmí implementovat opravy", "Nesmí blokovat nasazení > 48h"],
  };

  const specialists: Record<string, string[]> = {
    oc: ["Strategy Analyst", "Resource Allocator", "Owner Liaison"],
    arch: ["Standards Architect", "ADR Reviewer", "Technology Scout"],
    eng: ["Senior Developer Agent", "DevOps Agent", "Dependency Manager"],
    know: ["Knowledge Curator", "Search Specialist", "Archivist"],
    comm: ["Channel Manager", "Style Keeper", "Voice Interface Agent"],
    ops: ["Infrastructure Monitor", "Backup Manager", "Incident Responder"],
    qa: ["Test Architect", "Code Reviewer", "Quality Auditor"],
  };

  const docs: Record<string, string[]> = {
    oc: ["ORGANIZATION_CONSTITUTION.md", "BOOTSTRAP_AND_ROADMAP.md", "EXECUTIVE_BACKLOG.md"],
    arch: ["ARCHITECTURE.md", "docs/adr/", "CONCEPTUAL_MODEL.md"],
    eng: ["packages/", "apps/"],
    know: ["CONCEPTUAL_MODEL.md", "docs/"],
    comm: ["Komunikační styly a pravidla"],
    ops: ["docker-compose.yml", "docs/deployment/"],
    qa: ["docs/testing/", "Lessons Learned log"],
  };

  return {
    id,
    name,
    shortName,
    domain,
    missionStatement,
    bootstrapWave,
    kpis: kpis[id] ?? [],
    responsibilities: responsibilities[id] ?? [],
    boundaries: boundaries[id] ?? [],
    requiredSpecialists: specialists[id] ?? [],
    ownedDocumentation: docs[id] ?? [],
    status: "defined",
  };
}

function parseAdrFiles(): Decision[] {
  const decisions: Decision[] = [];
  const files = tryReadDir(ADR_DIR).filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md").sort();

  for (const file of files) {
    const content = tryRead(join(ADR_DIR, file));
    if (!content) continue;

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
    const authorMatch = content.match(/\*\*Autor:\*\*\s*(.+)/);
    const dateMatch = content.match(/\*\*Datum:\*\*\s*(.+)/);
    const reviewMatch = content.match(/\*\*Datum revize:\*\*\s*(.+)/);
    const contextMatch = content.match(/## Kontext\n\n([\s\S]*?)(?=\n##)/);
    const decisionMatch = content.match(/## Rozhodnutí\n\n([\s\S]*?)(?=\n##)/);
    const consequencesMatch = content.match(/## Důsledky\n\n([\s\S]*?)(?=\n##|$)/);

    decisions.push({
      id: file.replace(".md", ""),
      title: titleMatch?.[1] ?? file,
      status: statusMatch?.[1] ?? "unknown",
      author: authorMatch?.[1] ?? "Unknown",
      date: dateMatch?.[1] ?? "",
      reviewDate: reviewMatch?.[1] ?? "",
      context: contextMatch?.[1]?.trim() ?? "",
      decision: decisionMatch?.[1]?.trim() ?? "",
      consequences: consequencesMatch?.[1]?.trim() ?? "",
      path: `docs/adr/${file}`,
    });
  }

  return decisions;
}

function parseRisks(): Risk[] {
  const content = tryRead(join(BOARD_DIR, "BOOTSTRAP_AND_ROADMAP.md"));
  if (!content) return [];

  const risks: Risk[] = [];
  const riskSection = content.match(/### Rizika\n\n([\s\S]*?)(?=\n##|$)/);
  if (!riskSection) return risks;

  const riskLines = riskSection[1].split("\n");
  for (const line of riskLines) {
    if (line.startsWith("|") && !line.includes("---") && !line.includes("Riziko |")) {
      const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 4) {
        risks.push({
          id: `risk-${risks.length + 1}`,
          description: cols[0] ?? "",
          probability: (cols[1] as Risk["probability"]) ?? "Střední",
          impact: (cols[2] as Risk["impact"]) ?? "Střední",
          mitigation: cols[3] ?? "",
          source: "BOOTSTRAP_AND_ROADMAP.md",
        });
      }
    }
  }

  return risks;
}

function parseBlockers(): Blocker[] {
  const blockers: Blocker[] = [];
  const content = tryRead(join(ROOT_DIR, "TASKS.md"));
  const roadContent = tryRead(join(ROOT_DIR, "ROADMAP.md"));

  blockers.push({
    id: "block-1",
    title: "ARCHITECTURE.md nekompletní (skeleton)",
    description: "Architektonická specifikace čeká na dopracování ARCH oddělením — 9 sekcí označeno [K ROZPRACOVÁNÍ]",
    department: "ARCH",
    severity: "blocking",
    status: "active",
    reportedAt: "2026-07-03",
    source: "ARCHITECTURE.md",
  });

  blockers.push({
    id: "block-2",
    title: "BullMQ / Redis integrace pending",
    description: "Backend task — BullMQ (redis) integrace ještě není dokončena, blokuje background job processing",
    department: "ENG",
    severity: "delaying",
    status: "active",
    reportedAt: "2026-07-03",
    source: "TASKS.md",
  });

  blockers.push({
    id: "block-3",
    title: "Gmail, Calendar, Drive integrace skeleton",
    description: "Všechny integrace se Google službami jsou ve fázi skeleton — chybí OAuth flow",
    department: "COMM",
    severity: "delaying",
    status: "active",
    reportedAt: "2026-07-03",
    source: "TASKS.md",
  });

  blockers.push({
    id: "block-4",
    title: "Command layer není připraven",
    description: "AUDIT.md: command layer není ready, blokuje natural language ovládání",
    department: "ENG",
    severity: "warning",
    status: "active",
    reportedAt: "2026-07-03",
    source: "AUDIT.md",
  });

  return blockers;
}

function parseApprovals(): Approval[] {
  const approvals: Approval[] = [];
  const content = tryRead(join(ROOT_DIR, "TASKS.md"));

  approvals.push({
    id: "appr-1",
    title: "Schválení M2 (Agent Operating System)",
    description: "Milník M2 — implementace hotova, čeká na review a schválení",
    department: "OC",
    type: "escalation",
    urgency: "high",
    status: "pending",
    createdAt: "2026-07-08",
    context: "TASKS.md: M2 review pending",
  });

  approvals.push({
    id: "appr-2",
    title: "Schválení M3 (Real Data & Sync)",
    description: "Milník M3 — plán připraven (NEXT_MILESTONE.md), čeká na schválení zahájení",
    department: "OC",
    type: "escalation",
    urgency: "normal",
    status: "pending",
    createdAt: "2026-07-08",
    context: "TASKS.md: M3 review pending",
  });

  approvals.push({
    id: "appr-3",
    title: "ADR revize — 2027-01-08",
    description: "Všech 6 schválených ADR má revizní datum 2027-01-08 — zatím žádné nejsou po termínu",
    department: "ARCH",
    type: "adr",
    urgency: "low",
    status: "pending",
    createdAt: "2026-07-08",
    context: "docs/adr/ — všechna ADR čekají na revizi",
  });

  return approvals;
}

function parseGitActivity(): ActivityItem[] {
  const gitLog = getGitLog(ROOT_DIR, 20);

  return gitLog.map((entry, i) => ({
    id: `git-${i}`,
    type: "git" as const,
    title: entry.message,
    description: `Commit ${entry.hash}`,
    timestamp: entry.date,
    actor: entry.author,
  }));
}

function parseDocumentActivity(): ActivityItem[] {
  const items: ActivityItem[] = [];

  const decision = tryRead(join(ROOT_DIR, "ROADMAP.md"));
  if (decision) {
    items.push({
      id: "doc-roadmap",
      type: "decision",
      title: "Roadmap: M0-M6 definováno",
      description: "ROADMAP.md — Premium Foundation (M0) a Core Integrations (M1) APPROVED, M2 pending",
      timestamp: "2026-07-03T00:00:00Z",
      actor: "Chief Orchestrator",
      department: "OC",
    });
  }

  const chlog = tryRead(join(ROOT_DIR, "CHANGELOG.md"));
  if (chlog) {
    items.push({
      id: "doc-changelog",
      type: "system",
      title: "v0.1.0 release proveden",
      description: "Dashboard, Calendar Agent, Communication Agent, Chief of Staff — funkční MVP",
      timestamp: "2026-07-03T00:00:00Z",
      actor: "System",
      department: "ENG",
    });
  }

  items.push({
    id: "doc-bootstrap",
    type: "document",
    title: "Organizational Bootstrap dokončen",
    description: "Všech 7 oddělení definováno, EXECUTIVE_BOARD_AND_DEPARTMENTS.md hotovo",
    timestamp: "2026-07-08T00:00:00Z",
    actor: "Chief Orchestrator",
    department: "OC",
  });

  items.push({
    id: "doc-handoff",
    type: "document",
    title: "Department Handoff dokončen",
    description: "DEPARTMENT_HANDOFF.md — bootstrap complete, oddělení přebírají odpovědnost",
    timestamp: "2026-07-08T00:00:00Z",
    actor: "Chief Orchestrator",
    department: "OC",
  });

  return items;
}

function getGitLog(repoPath: string, maxCount: number): Array<{ hash: string; message: string; date: string; author: string }> {
  try {
    const output = execSync(
      `git -C "${repoPath}" log --oneline --format="%h|%s|%ai|%an" -n ${maxCount}`,
      { encoding: "utf-8", timeout: 5000 },
    );

    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, message, date, ...authorParts] = line.split("|");
        return {
          hash: hash ?? "",
          message: message ?? "",
          date: date ?? "",
          author: authorParts.join("|") ?? "",
        };
      });
  } catch {
    return [];
  }
}

export class FileExecutiveDataProvider implements ExecutiveDataProvider {
  async getOverview(): Promise<ExecutiveOverview> {
    return createFileProvider().getOverview();
  }
  async getMissions(): Promise<Mission[]> {
    return createFileProvider().getMissions();
  }
  async getDepartments(): Promise<Department[]> {
    return createFileProvider().getDepartments();
  }
  async getArtifacts(): Promise<Artifact[]> {
    return createFileProvider().getArtifacts();
  }
  async getDecisions(): Promise<Decision[]> {
    return createFileProvider().getDecisions();
  }
  async getRisks(): Promise<Risk[]> {
    return createFileProvider().getRisks();
  }
  async getBlockers(): Promise<Blocker[]> {
    return createFileProvider().getBlockers();
  }
  async getApprovals(): Promise<Approval[]> {
    return createFileProvider().getApprovals();
  }
  async getActivity(): Promise<ActivityItem[]> {
    return createFileProvider().getActivity();
  }
}

function createFileProvider(): ExecutiveDataProvider {
  return {
    async getOverview(): Promise<ExecutiveOverview> {
      const missions = await this.getMissions();
      const backlog = parseBacklogMarkdown(tryRead(join(BOARD_DIR, "EXECUTIVE_BACKLOG.md")) ?? "");
      const backlogItems = backlog.items;
      const risks = await this.getRisks();
      const blockers = await this.getBlockers();
      const approvals = await this.getApprovals();
      const activity = await this.getActivity();

      const byPriority: Record<string, { total: number; done: number }> = {};
      for (const item of backlogItems) {
        const p = item.priority;
        if (!byPriority[p]) byPriority[p] = { total: 0, done: 0 };
        byPriority[p].total++;
        if (item.status.toLowerCase().includes("hotovo") || item.status.toLowerCase().includes("done")) {
          byPriority[p].done++;
        }
      }

      return {
        generatedAt: new Date().toISOString(),
        bootstrap: {
          status: "Wave 0 dokončena, Wave 1 v přípravě",
          message: "7 oddělení definováno. ARCH, KNOW, COMM aktivovány. Department Handoff dokončen.",
        },
        backlogStats: {
          total: backlogItems.length,
          done: backlogItems.filter((i) => i.status.toLowerCase().includes("hotovo") || i.status.toLowerCase().includes("done")).length,
          waiting: backlogItems.filter((i) => !i.status.toLowerCase().includes("hotovo") && !i.status.toLowerCase().includes("done")).length,
          byPriority,
        },
        departments: [
          { id: "oc", name: "Office of the Chief", shortName: "OC", status: "defined", bootstrapWave: 0 },
          { id: "arch", name: "Architecture", shortName: "ARCH", status: "active", bootstrapWave: 0 },
          { id: "eng", name: "Engineering", shortName: "ENG", status: "defined", bootstrapWave: 1 },
          { id: "know", name: "Knowledge", shortName: "KNOW", status: "active", bootstrapWave: 0 },
          { id: "comm", name: "Communications", shortName: "COMM", status: "active", bootstrapWave: 0 },
          { id: "ops", name: "Operations", shortName: "OPS", status: "defined", bootstrapWave: 1 },
          { id: "qa", name: "Quality", shortName: "QA", status: "defined", bootstrapWave: 2 },
        ],
        missionStats: {
          total: missions.length,
          completed: missions.filter((m) => m.status === "completed").length,
          failed: missions.filter((m) => m.status === "failed").length,
          active: missions.filter((m) => m.status === "running").length,
        },
        decisionCount: (await this.getDecisions()).length,
        activeRisks: risks.length,
        activeBlockers: blockers.filter((b) => b.status === "active").length,
        pendingApprovals: approvals.filter((a) => a.status === "pending").length,
        recentActivityCount: activity.length,
      };
    },

    async getMissions(): Promise<Mission[]> {
      const missionsPath = join(MOCKS_DIR, "missions.json");
      if (existsSync(missionsPath)) {
        try {
          const raw = JSON.parse(readFileSync(missionsPath, "utf-8"));
          return parseMissionJson(Array.isArray(raw) ? raw : []);
        } catch { /* fall through */ }
      }
      return [];
    },

    async getDepartments(): Promise<Department[]> {
      const content = tryRead(join(BOARD_DIR, "EXECUTIVE_BOARD_AND_DEPARTMENTS.md"));
      if (content) {
        return parseDepartments(content);
      }
      return parseDepartments("");
    },

    async getArtifacts(): Promise<Artifact[]> {
      const artifacts: Artifact[] = [];

      artifacts.push({
        id: "art-constitution",
        title: "CONSTITUTION.md",
        type: "document",
        department: "OC",
        status: "done",
        path: "CONSTITUTION.md",
        description: "Nejvyšší dokument. 15 kapitol, 20 immutable principů. Platnost min. 10 let.",
      });

      artifacts.push({
        id: "art-org-constitution",
        title: "ORGANIZATION_CONSTITUTION.md",
        type: "document",
        department: "OC",
        status: "done",
        path: "ORGANIZATION_CONSTITUTION.md",
        description: "Organizační ústava — hierarchie, Board, oddělení, reporting, metriky.",
      });

      artifacts.push({
        id: "art-board-depts",
        title: "EXECUTIVE_BOARD_AND_DEPARTMENTS.md",
        type: "document",
        department: "OC",
        status: "done",
        path: "docs/board/EXECUTIVE_BOARD_AND_DEPARTMENTS.md",
        description: "7 oddělení s kompletními chartami, KPI, agentními specifikacemi.",
      });

      artifacts.push({
        id: "art-bootstrap",
        title: "BOOTSTRAP_AND_ROADMAP.md",
        type: "plan",
        department: "OC",
        status: "done",
        path: "docs/board/BOOTSTRAP_AND_ROADMAP.md",
        description: "Bootstrap plán, 6 vln, 8 milníků, 5 rizik, organizační roadmapa.",
      });

      artifacts.push({
        id: "art-conceptual",
        title: "CONCEPTUAL_MODEL.md",
        type: "model",
        department: "KNOW",
        status: "done",
        path: "CONCEPTUAL_MODEL.md",
        description: "Doménový model — 40+ termínů, 9 Bounded Contexts, state diagramy.",
      });

      artifacts.push({
        id: "art-backlog",
        title: "EXECUTIVE_BACKLOG.md",
        type: "plan",
        department: "OC",
        status: "done",
        path: "docs/board/EXECUTIVE_BACKLOG.md",
        description: "Prioritizovaný backlog — P0-P3 + nové návrhy. 23 položek.",
      });

      artifacts.push({
        id: "art-architecture",
        title: "ARCHITECTURE.md",
        type: "document",
        department: "ARCH",
        status: "in_progress",
        path: "ARCHITECTURE.md",
        description: "SKELETON. 9 sekcí čeká na dopracování ARCH oddělením.",
      });

      artifacts.push({
        id: "art-roadmap",
        title: "ROADMAP.md",
        type: "plan",
        department: "OC",
        status: "done",
        path: "ROADMAP.md",
        description: "Produktová roadmapa — M0-M6, M0-M1 approved, M2 pending.",
      });

      return artifacts;
    },

    async getDecisions(): Promise<Decision[]> {
      return parseAdrFiles();
    },

    async getRisks(): Promise<Risk[]> {
      return parseRisks();
    },

    async getBlockers(): Promise<Blocker[]> {
      return parseBlockers();
    },

    async getApprovals(): Promise<Approval[]> {
      return parseApprovals();
    },

    async getActivity(): Promise<ActivityItem[]> {
      const git = parseGitActivity();
      const docs = parseDocumentActivity();
      return [...git.slice(0, 10), ...docs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },
};
}

export const fileExecutiveDataProvider = new FileExecutiveDataProvider();
