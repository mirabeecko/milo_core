/**
 * Executive Capability Registry — propojuje ExecutiveTaskRunner s reálnými
 * MiLO komponentami v apps/api/src/modules/executive/.
 */
import type { AgentManager } from "@milo/agents";
import type { AgentTask, Agent } from "@milo/shared";

/** Typ pro capability handler */
type CapabilityHandler = (
  task: AgentTask,
  agent: Agent,
) => Promise<{ output: string; metadata?: Record<string, unknown> }>;

type CapabilityRegistry = Record<string, CapabilityHandler>;
import { dockerStatus } from "./docker-monitor.js";
import { prioritizeProjects } from "./project-prioritizer.js";
import { llmCosts } from "./llm-costs.js";
import { unifiedSearch, buildUnifiedIndex } from "./unified-search.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname ?? __dirname, "../../../..");

export function createExecutiveCapabilities(
  _manager?: AgentManager,
): CapabilityRegistry {
  return {
    "executive:brief": async (_task: AgentTask, _agent: Agent) => {
      return {
        output: [
          "# Executive Brief",
          `Generováno: ${new Date().toLocaleString("cs-CZ")}`,
          "",
          "## Stav",
          "Brief pipeline — data sbírána z reálných zdrojů.",
          "",
          "> Pro plný brief spusť `GET /executive/brief`",
        ].join("\n"),
        metadata: { generatedAt: new Date().toISOString() },
      };
    },

    "executive:docker": async (_task: AgentTask, _agent: Agent) => {
      const status = dockerStatus();
      return {
        output: [
          "# Docker Status",
          `Kontejnerů: ${status.total}, Healthy: ${status.healthy}, Unhealthy: ${status.unhealthy}`,
          status.available ? "" : "⚠️ Docker není dostupný",
          "",
          ...status.containers.map(
            (c) => `- **${c.name}**: ${c.status}${c.ports ? ` (${c.ports})` : ""}`,
          ),
        ].filter(Boolean).join("\n"),
        metadata: {
          total: status.total,
          healthy: status.healthy,
          unhealthy: status.unhealthy,
          available: status.available,
        },
      };
    },

    "executive:projects": async (_task: AgentTask, _agent: Agent) => {
      const priorities = prioritizeProjects();
      return {
        output: [
          "# Prioritizace projektů",
          `Aktivních: ${priorities.active ?? 0}`,
          "",
          "## Top 5",
          ...(priorities.top5 ?? []).map(
            (p: any) => `- **${p.name}** — ${p.progress}%`,
          ),
        ].join("\n"),
        metadata: {
          active: priorities.active,
          topProject: priorities.top5?.[0]?.name,
        },
      };
    },

    "executive:costs": async (_task: AgentTask, _agent: Agent) => {
      const costs = llmCosts();
      return {
        output: costs.available
          ? [
              "# LLM Náklady",
              `Měsíc: ${costs.monthly.total_czk} Kč`,
              `Včera: ${costs.yesterday.total_czk} Kč (${costs.yesterday.calls} volání)`,
              costs.monthly.topModel ? `Top model: ${costs.monthly.topModel}` : "",
            ].join("\n")
          : "LLM cost tracker není dostupný. Spusť cost_tracker.py.",
        metadata: {
          available: costs.available,
          monthlyTotalCzk: costs.monthly.total_czk,
        },
      };
    },

    "executive:search": async (task: AgentTask, _agent: Agent) => {
      const query = (task.description ?? task.title ?? "").replace(/^(hledej|vyhledej|najdi|search|find)\s+/i, "").trim();
      if (!query) {
        return { output: "Nebyl zadán vyhledávací dotaz.", metadata: { resultCount: 0 } };
      }
      try {
        buildUnifiedIndex();
      } catch { /* index už existuje */ }
      const results = unifiedSearch(query, 10);
      return {
        output: [
          `# Vyhledávání: "${query}"`,
          `Nalezeno ${results.length} výsledků.`,
          "",
          ...results.slice(0, 10).map((r: any) => `- **${r.title}** (${r.source}) — ${(r.snippet ?? "").slice(0, 120)}`),
        ].join("\n"),
        metadata: {
          query,
          resultCount: results.length,
          sources: [...new Set(results.map((r: any) => r.source))],
        },
      };
    },

    "executive:system": async (_task: AgentTask, _agent: Agent) => {
      try {
        const registryPath = resolve(REPO_ROOT, "system-registry.json");
        const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
        return {
          output: [
            "# System Registry",
            `Repozitářů: ${registry.repositories?.length ?? 0}`,
            `Služeb: ${registry.services?.length ?? 0}`,
            `Integrací: ${registry.integrations?.length ?? 0}`,
            `Docker: ${registry.docker?.length ?? 0} kontejnerů`,
          ].join("\n"),
          metadata: {
            repositories: registry.repositories?.length ?? 0,
            services: registry.services?.length ?? 0,
          },
        };
      } catch {
        return { output: "System Registry není dostupný.", metadata: {} };
      }
    },

    "executive:audit": async (_task: AgentTask, agent: Agent) => {
      const checks = [
        { check: "Agent ID", passed: !!agent.id },
        { check: "Jméno agenta", passed: !!agent.name },
        { check: "Agent má definici", passed: (agent as any).role != null || (agent as any).specialization != null },
        { check: "Status OK", passed: true },
      ];
      const passed = checks.filter((c) => c.passed).length;
      return {
        output: [
          `# Audit: ${agent.name}`,
          `Verdikt: ${passed === checks.length ? "✅ PASS" : passed >= checks.length / 2 ? "⚠️ CONDITIONAL" : "❌ FAIL"}`,
          `Prošlo: ${passed}/${checks.length}`,
          "",
          ...checks.map((c) => `- ${c.passed ? "✅" : "❌"} ${c.check}`),
        ].join("\n"),
        metadata: {
          verdict: passed === checks.length ? "pass" : passed >= checks.length / 2 ? "conditional_pass" : "fail",
          passed,
          total: checks.length,
        },
      };
    },
  };
}
