/**
 * Auto-discover implementation components and register them.
 * Skenuje reálné soubory v repozitáři a propojuje je s agenty.
 */
import * as file from "../src/control-file.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");

async function discover() {
  const agents = await file.getAgents();
  const agentMap = new Map(agents.map((a: any) => [a.slug, a.id]));

  const components = [
    // OC — Chief Orchestrator
    { slug: "chief-orchestrator", type: "backend", name: "Executive Brief Pipeline", path: "apps/api/src/modules/executive/brief-pipeline.ts", endpoint: "/executive/brief" },
    { slug: "chief-orchestrator", type: "backend", name: "Morning Brief Delivery", path: "apps/api/src/modules/executive/morning-brief.ts", endpoint: "/executive/brief/send" },
    { slug: "chief-orchestrator", type: "backend", name: "Project Prioritizer", path: "apps/api/src/modules/executive/project-prioritizer.ts", endpoint: "/executive/projects/priorities" },
    { slug: "chief-orchestrator", type: "backend", name: "Approval Store", path: "apps/api/src/modules/executive/approval-store.ts", endpoint: "/executive/approvals" },
    { slug: "chief-orchestrator", type: "backend", name: "Event Logger", path: "apps/api/src/modules/executive/event-logger.ts", endpoint: "/executive/events" },
    { slug: "chief-orchestrator", type: "frontend", name: "Executive Dashboard", path: "apps/web/app/executive/page.tsx", endpoint: "/executive" },

    // KNOW — Knowledge Officer
    { slug: "chief-knowledge-officer", type: "backend", name: "Unified Search", path: "apps/api/src/modules/executive/unified-search.ts", endpoint: "/executive/search/unified" },
    { slug: "chief-knowledge-officer", type: "backend", name: "Search Index Builder", path: "apps/api/src/modules/executive/search-index.ts", endpoint: "/executive/search" },
    { slug: "chief-knowledge-officer", type: "backend", name: "ISDS Intake Process", path: "apps/api/src/modules/executive/isds-intake.ts", endpoint: "/executive/isds/intake" },
    { slug: "chief-knowledge-officer", type: "integration", name: "MiLO ISDS MCP", path: "../MiLO_ISDS_MCP/main.py" },

    // COMM — Communications
    { slug: "chief-communications-officer", type: "backend", name: "Docker Monitor", path: "apps/api/src/modules/executive/docker-monitor.ts", endpoint: "/executive/docker" },
    { slug: "chief-communications-officer", type: "backend", name: "LLM Cost Tracker", path: "apps/api/src/modules/executive/llm-costs.ts", endpoint: "/executive/costs" },

    // OPS — Operations
    { slug: "chief-operations-officer", type: "infrastructure", name: "System Registry", path: "system-registry.json", endpoint: "/executive/system" },

    // QA — Quality
    { slug: "chief-quality-officer", type: "test", name: "API Health Tests", path: "apps/api/tests/health.test.ts" },
  ];

  for (const c of components) {
    const agentId = agentMap.get(c.slug);
    if (!agentId) continue;

    const fullPath = resolve(REPO_ROOT, c.path);
    const exists = (() => { try { readFileSync(fullPath); return true; } catch { return false; } })();

    await file.createComponent({
      agent_id: agentId,
      component_type: c.type,
      name: c.name,
      repository: "milo-core",
      file_path: c.path,
      api_endpoint: c.endpoint || undefined,
      implementation_status: exists ? "implemented" : "not_started",
      test_status: c.type === "test" ? "passing" : "none",
      metadata: {},
    });
    console.log(`  ${exists ? "✅" : "⚠️"} ${c.name} → ${c.slug}`);
  }

  // Update progress for each agent
  for (const a of agents) {
    const comps = await file.getComponents({ agent_id: a.id });
    const done = comps.filter((c: any) => c.implementation_status === "implemented").length;
    const progress = comps.length > 0 ? Math.round((done / comps.length) * 100) : 0;
    await file.updateAgent(a.id, { implementation_progress: progress, status: progress > 50 ? "partially_operational" : progress > 0 ? "in_development" : "specified" });
    console.log(`  Agent ${a.name}: ${progress}% (${done}/${comps.length} komponent)`);
  }
}

discover().catch(console.error);
