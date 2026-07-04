import type { AgentManager } from "../agent-manager.js";
import { ChiefOfStaffAgent } from "../agents/chief-of-staff.js";
import { ResearchAgent } from "../agents/research.js";
import { chiefOfStaffDefinition } from "./chief-of-staff.js";
import { researchAgentDefinition } from "./research.js";

export * from "./chief-of-staff.js";
export * from "./research.js";

// Scope is intentionally limited to Chief of Staff and Research Agent
// until the Mission → Task → Execution → Result → Report flow is fully
// functional. Other definitions remain in the codebase but are not registered.
export const activeAgentDefinitions = [chiefOfStaffDefinition, researchAgentDefinition];

export async function registerDefaultAgents(manager: AgentManager): Promise<void> {
  for (const definition of activeAgentDefinitions) {
    if (definition.id === "chief-of-staff") {
      await manager.register(definition, (def, deps) => new ChiefOfStaffAgent(def, deps));
    } else if (definition.id === "research") {
      await manager.register(definition, (def, deps) => new ResearchAgent(def, deps));
    } else {
      await manager.register(definition);
    }
  }
}
