/**
 * Executive Agent Registry — mapování ExecutiveAgentDefinition → AgentDefinition
 * pro registraci do existujícího AgentManageru.
 *
 * Definice jsou v packages/agents/src/registry/executive-agents.ts (TypeScript).
 * Autoritativní zdroj: organization-registry.json (JSON).
 */
import type { AgentDefinition } from "@milo/shared";
import { EXECUTIVE_AGENT_LIST } from "./executive-agents.js";
import { ExecutiveAgent } from "../agents/executive-agent.js";
import type { AgentManager } from "../agent-manager.js";

/**
 * Převede ExecutiveAgentDefinition na AgentDefinition
 * (zahodí executive rozšíření — to je pro organizační vrstvu, ne runtime).
 */
export function toAgentDefinition(
  exec: (typeof EXECUTIVE_AGENT_LIST)[number],
): AgentDefinition {
  return {
    id: exec.id,
    name: exec.name,
    description: exec.description,
    role: exec.role,
    specialization: exec.specialization,
    priority: exec.priority,
    config: exec.config,
  };
}

/** Všechny Executive Agent definice připravené pro AgentManager */
export const executiveAgentDefinitions: AgentDefinition[] =
  EXECUTIVE_AGENT_LIST.map(toAgentDefinition);

/**
 * Zaregistruje všech 7 Executive Agentů do existujícího AgentManageru.
 */
export async function registerExecutiveAgents(
  manager: AgentManager,
): Promise<void> {
  for (const exec of EXECUTIVE_AGENT_LIST) {
    const def = toAgentDefinition(exec);
    const dept = exec.executive.department;
    await manager.register(def, (agentDef, deps) => new ExecutiveAgent(agentDef, deps, dept));
  }
}
