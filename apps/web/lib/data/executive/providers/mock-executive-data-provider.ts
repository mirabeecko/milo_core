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

const NOW = new Date().toISOString();

export class MockExecutiveDataProvider implements ExecutiveDataProvider {
  async getOverview(): Promise<ExecutiveOverview> {
    return {
      generatedAt: NOW,
      bootstrap: {
        status: "Wave 1 — Technical Foundation",
        message: "7 oddělení definováno. ARCH, KNOW, COMM aktivní v testovacím režimu. ENG a OPS v přípravě.",
      },
      backlogStats: {
        total: 23,
        done: 3,
        waiting: 20,
        byPriority: {
          P0: { total: 5, done: 3 },
          P1: { total: 5, done: 0 },
          P2: { total: 3, done: 0 },
          P3: { total: 5, done: 0 },
          N: { total: 5, done: 0 },
        },
      },
      departments: [
        { id: "oc", name: "Office of the Chief", shortName: "OC", status: "active", bootstrapWave: 0 },
        { id: "arch", name: "Architecture", shortName: "ARCH", status: "active", bootstrapWave: 0 },
        { id: "eng", name: "Engineering", shortName: "ENG", status: "ready", bootstrapWave: 1 },
        { id: "know", name: "Knowledge", shortName: "KNOW", status: "active", bootstrapWave: 0 },
        { id: "comm", name: "Communications", shortName: "COMM", status: "active", bootstrapWave: 0 },
        { id: "ops", name: "Operations", shortName: "OPS", status: "ready", bootstrapWave: 1 },
        { id: "qa", name: "Quality", shortName: "QA", status: "ready", bootstrapWave: 2 },
      ],
      missionStats: { total: 4, completed: 2, failed: 1, active: 1 },
      decisionCount: 6,
      activeRisks: 5,
      activeBlockers: 2,
      pendingApprovals: 2,
      recentActivityCount: 12,
    };
  }

  async getMissions(): Promise<Mission[]> {
    return [
      {
        id: "mock-mission-1",
        title: "Vytvořit ARCHITECTURE.md",
        description: "Dokončit architektonickou specifikaci — 9 sekcí",
        status: "running",
        priority: "critical",
        ownerId: "chief-architect",
        ownerName: "Chief Architect",
        department: "ARCH",
        createdAt: "2026-07-09T08:00:00Z",
        startedAt: "2026-07-09T08:00:00Z",
      },
      {
        id: "mock-mission-2",
        title: "Zaindexovat existující dokumenty",
        description: "KNOW oddělení indexuje všechny dokumenty v repozitáři",
        status: "completed",
        priority: "high",
        ownerId: "chief-knowledge",
        ownerName: "Chief Knowledge Officer",
        department: "KNOW",
        createdAt: "2026-07-08T10:00:00Z",
        startedAt: "2026-07-08T10:00:00Z",
        completedAt: "2026-07-09T12:00:00Z",
        result: {
          output: "Zaindexováno 42 dokumentů, 156 poznámek.",
          citations: ["Obsidian vault", "docs/", "CONSTITUTION.md"],
        },
      },
      {
        id: "mock-mission-3",
        title: "Sjednotit Telegram boty",
        description: "Přejmout existující boty pod jednotný framework",
        status: "completed",
        priority: "normal",
        ownerId: "chief-communications",
        ownerName: "Chief Communications Officer",
        department: "COMM",
        createdAt: "2026-07-08T09:00:00Z",
        completedAt: "2026-07-09T18:00:00Z",
        result: { output: "3 boti sjednoceni pod jeden routing framework." },
      },
      {
        id: "mock-mission-4",
        title: "Nastavit CI/CD pipeline",
        description: "GitHub Actions + Docker build pipeline",
        status: "failed",
        priority: "normal",
        ownerId: "demo-agent",
        ownerName: "Demo Agent",
        department: "ENG",
        createdAt: "2026-07-07T14:00:00Z",
        completedAt: "2026-07-07T14:00:05Z",
        result: { error: "Missing Docker configuration — OPS department not yet active" },
      },
    ];
  }

  async getDepartments(): Promise<Department[]> {
    return [
      {
        id: "oc", name: "Office of the Chief", shortName: "OC",
        domain: "Strategie, koordinace, rozhraní k Vlastníkovi",
        missionStatement: "Zajistit, aby MiLO jako celek naplňoval Ústavu.",
        bootstrapWave: 0, status: "active",
        kpis: [
          { metric: "Vlastníkova spokojenost", target: "≥ 4/5" },
          { metric: "Míra eskalací", target: "≤ 5 %" },
        ],
        responsibilities: ["Definovat strategické cíle", "Alokovat rozpočet"],
        boundaries: ["Nesmí řídit jednotlivé mise", "Nesmí měnit Ústavu bez ratifikace"],
        requiredSpecialists: ["Strategy Analyst", "Resource Allocator", "Owner Liaison"],
        ownedDocumentation: ["ORGANIZATION_CONSTITUTION.md", "BOOTSTRAP_AND_ROADMAP.md"],
      },
      {
        id: "arch", name: "Architecture", shortName: "ARCH",
        domain: "Systémový návrh, ADR, technické standardy",
        missionStatement: "Zajistit architektonickou integritu a nahraditelnost komponent.",
        bootstrapWave: 0, status: "active",
        kpis: [
          { metric: "ADRs approved", target: "6" },
          { metric: "Architektonický dluh", target: "0" },
        ],
        responsibilities: ["Udržovat ARCHITECTURE.md", "Spravovat ADR proces"],
        boundaries: ["Nesmí implementovat", "Nesmí blokovat bez ADR"],
        requiredSpecialists: ["Standards Architect", "ADR Reviewer", "Technology Scout"],
        ownedDocumentation: ["ARCHITECTURE.md", "docs/adr/", "CONCEPTUAL_MODEL.md"],
      },
      {
        id: "eng", name: "Engineering", shortName: "ENG",
        domain: "Vývoj, údržba, nasazení softwaru",
        missionStatement: "Stavět, udržovat a nasazovat software podle ARCH specifikace.",
        bootstrapWave: 1, status: "ready",
        kpis: [
          { metric: "Test coverage", target: "≥ 80 %" },
          { metric: "Incident rate", target: "Klesající" },
        ],
        responsibilities: ["Implementovat software", "Udržovat kód", "Spravovat CI/CD"],
        boundaries: ["Nesmí měnit architekturu bez ADR", "Nesmí nasazovat bez QA a OPS"],
        requiredSpecialists: ["Senior Developer Agent", "DevOps Agent", "Dependency Manager"],
        ownedDocumentation: ["packages/", "apps/"],
      },
      {
        id: "know", name: "Knowledge", shortName: "KNOW",
        domain: "Paměť, učení, dokumenty, vyhledávání",
        missionStatement: "Zajistit znovupoužitelnost znalostí. Udržovat organizační paměť.",
        bootstrapWave: 0, status: "active",
        kpis: [
          { metric: "Doba vyhledání", target: "≤ 5 sekund" },
          { metric: "Znovupoužití znalostí", target: "Rostoucí" },
        ],
        responsibilities: ["Spravovat znalostní bázi", "Indexovat dokumenty"],
        boundaries: ["Nesmí mazat znalosti bez schválení"],
        requiredSpecialists: ["Knowledge Curator", "Search Specialist", "Archivist"],
        ownedDocumentation: ["CONCEPTUAL_MODEL.md", "docs/"],
      },
      {
        id: "comm", name: "Communications", shortName: "COMM",
        domain: "Externí kanály, zprávy, notifikace",
        missionStatement: "Spravovat všechny externí komunikační kanály.",
        bootstrapWave: 0, status: "active",
        kpis: [
          { metric: "Doba doručení zprávy", target: "≤ 30 sekund" },
          { metric: "Dostupnost kanálů", target: "≥ 99.5 %" },
        ],
        responsibilities: ["Spravovat Telegram bota", "Spravovat hlasové rozhraní"],
        boundaries: ["Nesmí číst soukromé zprávy Vlastníka"],
        requiredSpecialists: ["Channel Manager", "Style Keeper", "Voice Interface Agent"],
        ownedDocumentation: ["Komunikační styly a pravidla"],
      },
      {
        id: "ops", name: "Operations", shortName: "OPS",
        domain: "Infrastruktura, monitoring, zálohování",
        missionStatement: "Udržet MiLO v chodu 24/7.",
        bootstrapWave: 1, status: "ready",
        kpis: [
          { metric: "Uptime", target: "≥ 99.5 %" },
          { metric: "RPO", target: "≤ 1 hodina" },
        ],
        responsibilities: ["Spravovat infrastrukturu", "Monitorovat health"],
        boundaries: ["Nesmí měnit kód", "Nesmí měnit architekturu"],
        requiredSpecialists: ["Infrastructure Monitor", "Backup Manager", "Incident Responder"],
        ownedDocumentation: ["docker-compose.yml", "docs/deployment/"],
      },
      {
        id: "qa", name: "Quality", shortName: "QA",
        domain: "Testování, revize, metrika, standardy",
        missionStatement: "Zajistit standardy kvality — nic nekvalitního neprojde do produkce.",
        bootstrapWave: 2, status: "ready",
        kpis: [
          { metric: "Chybovost v produkci", target: "Klesající" },
          { metric: "Regrese", target: "0" },
        ],
        responsibilities: ["Definovat testovací strategii", "Provádět code review"],
        boundaries: ["Nesmí implementovat opravy", "Nesmí blokovat > 48h"],
        requiredSpecialists: ["Test Architect", "Code Reviewer", "Quality Auditor"],
        ownedDocumentation: ["docs/testing/", "Lessons Learned log"],
      },
    ];
  }

  async getArtifacts(): Promise<Artifact[]> {
    return [
      {
        id: "mock-art-1", title: "CONSTITUTION.md",
        type: "document", department: "OC", status: "done",
        path: "CONSTITUTION.md",
        description: "Nejvyšší dokument. 15 kapitol, 20 immutable principů.",
      },
      {
        id: "mock-art-2", title: "ARCHITECTURE.md",
        type: "document", department: "ARCH", status: "in_progress",
        path: "ARCHITECTURE.md",
        description: "9 sekcí čeká na dopracování ARCH oddělením.",
      },
      {
        id: "mock-art-3", title: "CONCEPTUAL_MODEL.md",
        type: "model", department: "KNOW", status: "done",
        path: "CONCEPTUAL_MODEL.md",
        description: "40+ termínů, 9 Bounded Contexts.",
      },
      {
        id: "mock-art-4", title: "EXECUTIVE_BACKLOG.md",
        type: "plan", department: "OC", status: "done",
        path: "docs/board/EXECUTIVE_BACKLOG.md",
        description: "23 položek napříč P0-P3.",
      },
    ];
  }

  async getDecisions(): Promise<Decision[]> {
    return [
      {
        id: "ADR-0001", title: "Monorepo — pnpm workspace",
        status: "APPROVED", author: "Chief Orchestrator",
        date: "2026-07-08", reviewDate: "2027-01-08",
        context: "Potřebujeme strukturu repozitáře, která umožňuje sdílet kód a nahraditelnost komponent.",
        decision: "Používáme pnpm workspace monorepo.",
        consequences: "Snazší sdílení kódu, jednotné lintování/testování/build.",
        path: "docs/adr/0001-monorepo-structure.md",
      },
      {
        id: "ADR-0002", title: "DDD + Hexagonal architecture",
        status: "APPROVED", author: "Chief Orchestrator",
        date: "2026-07-08", reviewDate: "2027-01-08",
        context: "MiLO potřebuje architektonický styl, který podporuje nahraditelnost.",
        decision: "DDD + Hexagonal (ports & adapters).",
        consequences: "Jasné bounded contexts, provider abstraction.",
        path: "docs/adr/0002-ddd-hexagonal.md",
      },
      {
        id: "ADR-0003", title: "Agent state machine",
        status: "APPROVED", author: "Chief Orchestrator",
        date: "2026-07-08", reviewDate: "2027-01-08",
        context: "Agenti potřebují explicitní, testovatelný životní cyklus.",
        decision: "8-stavový explicitní state machine.",
        consequences: "Deterministické přechody, snadnější ladění.",
        path: "docs/adr/0003-agent-state-machine.md",
      },
      {
        id: "ADR-0011", title: "Framework Reuse Assessment",
        status: "APPROVED", author: "Chief Orchestrator",
        date: "2026-07-08", reviewDate: "2027-01-08",
        context: "MiLO nesmí znovu vynalézat orchestrační infrastrukturu.",
        decision: "Integrovat LangGraph/Hermes. Stavět jen MiLO-unikátní vrstvu.",
        consequences: "Rychlejší vývoj, menší riziko.",
        path: "docs/adr/0011-framework-reuse-assessment.md",
      },
    ];
  }

  async getRisks(): Promise<Risk[]> {
    return [
      {
        id: "mock-risk-1",
        description: "ARCH a ENG se neshodnou na specifikaci",
        probability: "Střední", impact: "Vysoký",
        mitigation: "ADR proces, Chief jako arbitr",
        source: "BOOTSTRAP_AND_ROADMAP.md",
      },
      {
        id: "mock-risk-2",
        description: "Existující projekty blokují migraci",
        probability: "Vysoká", impact: "Střední",
        mitigation: "Postupná migrace, staré projekty v maintenance modu",
        source: "BOOTSTRAP_AND_ROADMAP.md",
      },
      {
        id: "mock-risk-3",
        description: "Nedostatek výpočetních zdrojů",
        probability: "Nízká", impact: "Střední",
        mitigation: "Lokální Ollama jako fallback",
        source: "BOOTSTRAP_AND_ROADMAP.md",
      },
      {
        id: "mock-risk-4",
        description: "Klíčový agent selže",
        probability: "Střední", impact: "Vysoký",
        mitigation: "Bus factor ≥ 2 pro každou kritickou funkci",
        source: "BOOTSTRAP_AND_ROADMAP.md",
      },
    ];
  }

  async getBlockers(): Promise<Blocker[]> {
    return [
      {
        id: "mock-block-1",
        title: "ARCHITECTURE.md nekompletní (skeleton)",
        description: "9 sekcí označeno [K ROZPRACOVÁNÍ] — čeká na ARCH oddělení",
        department: "ARCH", severity: "blocking", status: "active",
        reportedAt: "2026-07-03", source: "ARCHITECTURE.md",
      },
      {
        id: "mock-block-2",
        title: "Gmail, Calendar, Drive integrace skeleton",
        description: "Chybí OAuth flow pro Google služby",
        department: "COMM", severity: "delaying", status: "active",
        reportedAt: "2026-07-03", source: "TASKS.md",
      },
    ];
  }

  async getApprovals(): Promise<Approval[]> {
    return [
      {
        id: "mock-appr-1",
        title: "Schválení M2 (Agent Operating System)",
        description: "Milník M2 — implementace hotova, čeká na review",
        department: "OC", type: "escalation", urgency: "high", status: "pending",
        createdAt: "2026-07-08",
        context: "TASKS.md: M2 review pending",
      },
      {
        id: "mock-appr-2",
        title: "Schválení M3 (Real Data & Sync)",
        description: "Plán připraven, čeká na zahájení",
        department: "OC", type: "escalation", urgency: "normal", status: "pending",
        createdAt: "2026-07-08",
        context: "TASKS.md: M3 review pending",
      },
      {
        id: "mock-appr-3",
        title: "Test approval — demo",
        description: "Ukázkové schválení pro testování dashboardu",
        department: "ARCH", type: "adr", urgency: "low", status: "approved",
        createdAt: "2026-07-09",
        context: "Demo data pro testování UI",
      },
    ];
  }

  async getActivity(): Promise<ActivityItem[]> {
    return [
      {
        id: "mock-act-1", type: "git",
        title: "feat: implement Agent Operating System framework",
        description: "Commit d60d51c",
        timestamp: "2026-07-03T16:38:23Z",
        actor: "mb",
        department: "ENG",
      },
      {
        id: "mock-act-2", type: "git",
        title: "feat: production-ready agent runtime core",
        description: "Commit d086baa",
        timestamp: "2026-07-03T19:03:19Z",
        actor: "mb",
        department: "ENG",
      },
      {
        id: "mock-act-3", type: "git",
        title: "feat: connect local Obsidian vault with indexing",
        description: "Commit 1646abb",
        timestamp: "2026-07-03T14:27:23Z",
        actor: "mb",
        department: "KNOW",
      },
      {
        id: "mock-act-4", type: "document",
        title: "Organizational Bootstrap dokončen",
        description: "Všech 7 oddělení definováno, charty hotovy",
        timestamp: "2026-07-08T00:00:00Z",
        actor: "Chief Orchestrator",
        department: "OC",
      },
      {
        id: "mock-act-5", type: "decision",
        title: "ADR-0011: Framework Reuse Assessment approved",
        description: "MiLO staví jen unikátní vrstvu, zbytek z existujících frameworků",
        timestamp: "2026-07-08T00:00:00Z",
        actor: "Chief Orchestrator",
        department: "ARCH",
      },
      {
        id: "mock-act-6", type: "mission",
        title: "Mise KNOW-001: CONCEPTUAL_MODEL.md dokončena",
        description: "40+ termínů, 9 Bounded Contexts",
        timestamp: "2026-07-09T00:00:00Z",
        actor: "Chief Knowledge Officer",
        department: "KNOW",
      },
      {
        id: "mock-act-7", type: "system",
        title: "v0.1.0 release",
        description: "Dashboard, Calendar Agent, Communication Agent — funkční MVP",
        timestamp: "2026-07-03T00:00:00Z",
        actor: "System",
        department: "ENG",
      },
      {
        id: "mock-act-8", type: "agent",
        title: "Chief of Staff: stav idle",
        description: "Čeká na instrukci od uživatele",
        timestamp: NOW,
        actor: "Chief of Staff",
        department: "OC",
      },
    ];
  }
}

export const mockExecutiveDataProvider = new MockExecutiveDataProvider();
