/**
 * Seed Control Center data — file-based version.
 * Vytvoří 7 Executive agentů, use cases a capabilities.
 */
import * as file from "../src/control-file.js";

const agents = [
  { slug: "chief-orchestrator", name: "Chief Orchestrator", description: "Hlavní koordinátor. Přijímá cíle, rozděluje práci, monitoruje progress.", purpose: "Orchestrace organizace", category: "executive", owner: "Vlastník" },
  { slug: "chief-architect", name: "Chief Architect", description: "Vlastní architekturu. ADR, technické standardy, framework reuse.", purpose: "Architektura", category: "executive", owner: "OC" },
  { slug: "chief-engineer", name: "Chief Engineer", description: "Vlastní implementaci. Repozitáře, CI/CD, deployment.", purpose: "Vývoj", category: "executive", owner: "ARCH" },
  { slug: "chief-knowledge-officer", name: "Chief Knowledge Officer", description: "Znalostní báze. Indexace, vyhledávání, OCR, ISDS.", purpose: "Knowledge management", category: "executive", owner: "OC" },
  { slug: "chief-communications-officer", name: "Chief Communications Officer", description: "Komunikační kanály. Telegram, Gmail, notifikace.", purpose: "Komunikace", category: "executive", owner: "OC" },
  { slug: "chief-operations-officer", name: "Chief Operations Officer", description: "Infrastruktura. Docker, VPS, zálohování, monitoring.", purpose: "Provoz", category: "executive", owner: "OC" },
  { slug: "chief-quality-officer", name: "Chief Quality Officer", description: "Kvalita. Nezávislý audit, testování, review.", purpose: "Kvalita", category: "executive", owner: "OC" },
];

const useCases = [
  { agent_idx: 0, slug: "daily-brief", name: "Denní briefing", description: "Každé ráno vygenerovat Executive Brief", category: "reporting" },
  { agent_idx: 0, slug: "task-routing", name: "Routování úkolů", description: "Rozdělit úkol na odpovědné oddělení", category: "coordination" },
  { agent_idx: 0, slug: "project-prioritization", name: "Prioritizace projektů", description: "Seřadit 53 projektů podle priority", category: "planning" },
  { agent_idx: 3, slug: "document-search", name: "Vyhledávání", description: "Fulltextové vyhledávání v dokumentech", category: "search" },
  { agent_idx: 3, slug: "isds-intake", name: "ISDS příjem zpráv", description: "Zpracovat novou zprávu z datové schránky", category: "legal" },
  { agent_idx: 3, slug: "deadline-watch", name: "Hlídání lhůt", description: "Kontrola blížících se lhůt", category: "legal" },
  { agent_idx: 4, slug: "telegram-unification", name: "Sjednocení Telegramu", description: "Sjednotit 3 boty pod jednoho", category: "communication" },
  { agent_idx: 4, slug: "gmail-triage", name: "Třídění Gmailu", description: "Klasifikace důležitosti emailů", category: "communication" },
  { agent_idx: 5, slug: "docker-monitoring", name: "Docker monitoring", description: "Monitorovat kontejnery", category: "infrastructure" },
  { agent_idx: 5, slug: "auto-backup", name: "Zálohování", description: "Automatické denní zálohy", category: "infrastructure" },
  { agent_idx: 6, slug: "code-audit", name: "Audit kódu", description: "Nezávislá kontrola změn", category: "quality" },
  { agent_idx: 6, slug: "spec-compliance", name: "Soulad se specifikací", description: "Kontrola implementace vs specifikace", category: "quality" },
];

const capabilities = [
  { capability_code: "document_search", name: "Fulltextové vyhledávání", description: "Markdown, PDF, zdrojový kód", category: "knowledge" },
  { capability_code: "ocr", name: "OCR", description: "Optické rozpoznávání textu", category: "knowledge" },
  { capability_code: "deadline_extraction", name: "Extrakce lhůt", description: "Vyhledání datumů v dokumentech", category: "legal" },
  { capability_code: "gmail_search", name: "Gmail vyhledávání", description: "Čtení a klasifikace emailů", category: "communication" },
  { capability_code: "telegram_send", name: "Telegram odesílání", description: "Odesílání zpráv", category: "communication" },
  { capability_code: "docker_health", name: "Docker health check", description: "Monitoring kontejnerů", category: "infrastructure" },
  { capability_code: "backup", name: "Zálohování", description: "Automatické zálohy", category: "infrastructure" },
  { capability_code: "git_diff", name: "Git diff", description: "Analýza změn v repozitáři", category: "development" },
  { capability_code: "code_review", name: "Code review", description: "Kontrola kvality kódu", category: "quality" },
];

async function seed() {
  console.log("Seeding Control Center...");

  const agentIds: string[] = [];
  for (const a of agents) {
    const created = await file.createAgent(a);
    agentIds.push(created.id);
    console.log(`  Agent: ${a.name}`);
  }

  for (const uc of useCases) {
    const agentId = agentIds[uc.agent_idx];
    if (agentId) {
      const { agent_idx, ...rest } = uc;
      await file.createUseCase({ ...rest, agent_id: agentId });
      console.log(`  UseCase: ${uc.name}`);
    }
  }

  for (const c of capabilities) {
    await file.createCapability(c);
    console.log(`  Capability: ${c.name}`);
  }

  console.log("Done.");
}

seed();
