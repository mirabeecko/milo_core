import type { AgentManager } from "../agent-manager.js";
import { ChiefOfStaffAgent } from "../agents/chief-of-staff.js";
import { ResearchAgent } from "../agents/research.js";
import { CalendarAgent } from "../agents/calendar.js";
import { SecretaryAgent } from "../agents/communication.js";
import { DesignAgent } from "../agents/design.js";
import { NotifierAgent } from "../agents/notifier.js";
import { chiefOfStaffDefinition } from "./chief-of-staff.js";
import { researchAgentDefinition } from "./research.js";
import { calendarAgentDefinition } from "./calendar.js";
import { secretaryAgentDefinition } from "./communication.js";
import { designAgentDefinition } from "./design.js";
import { notifierAgentDefinition } from "./notifier.js";
import { registerExecutiveAgents } from "./executive.js";

export * from "./chief-of-staff.js";
export * from "./research.js";
export * from "./calendar.js";
export * from "./communication.js";
export * from "./design.js";
export * from "./notifier.js";
export * from "./executive.js";

export const activeAgentDefinitions = [
  chiefOfStaffDefinition,
  researchAgentDefinition,
  calendarAgentDefinition,
  secretaryAgentDefinition,
  designAgentDefinition,
  notifierAgentDefinition,
];

export async function registerDefaultAgents(manager: AgentManager): Promise<void> {
  for (const definition of activeAgentDefinitions) {
    if (definition.id === "chief-of-staff") {
      await manager.register(definition, (def, deps) => new ChiefOfStaffAgent(def, deps));
    } else if (definition.id === "research") {
      await manager.register(definition, (def, deps) => new ResearchAgent(def, deps));
    } else if (definition.id === "calendar") {
      await manager.register(definition, (def, deps) => new CalendarAgent(def, deps));
    } else if (definition.id === "secretary") {
      await manager.register(definition, (def, deps) => new SecretaryAgent(def, deps));
    } else if (definition.id === "design") {
      await manager.register(definition, (def, deps) => new DesignAgent(def, deps));
    } else if (definition.id === "notifier") {
      await manager.register(definition, (def, deps) => new NotifierAgent(def, deps));
    } else {
      await manager.register(definition);
    }
  }
  // Register Executive Agent definitions
  await registerExecutiveAgents(manager);
}
