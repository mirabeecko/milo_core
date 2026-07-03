import type { AgentManager } from "../agent-manager.js";
import { CalendarAgent } from "../agents/calendar.js";
import { ChiefOfStaffAgent } from "../agents/chief-of-staff.js";
import { CommunicationAgent } from "../agents/communication.js";
import { automationAgentDefinition } from "./automation.js";
import { calendarAgentDefinition } from "./calendar.js";
import { chiefOfStaffDefinition } from "./chief-of-staff.js";
import { communicationAgentDefinition } from "./communication.js";
import { developerAgentDefinition } from "./developer.js";
import { documentAgentDefinition } from "./document.js";
import { knowledgeAgentDefinition } from "./knowledge.js";
import { legalAgentDefinition } from "./legal.js";
import { researchAgentDefinition } from "./research.js";

export * from "./chief-of-staff.js";
export * from "./developer.js";
export * from "./research.js";
export * from "./knowledge.js";
export * from "./legal.js";
export * from "./document.js";
export * from "./calendar.js";
export * from "./communication.js";
export * from "./automation.js";

export const defaultAgentDefinitions = [
  chiefOfStaffDefinition,
  developerAgentDefinition,
  researchAgentDefinition,
  knowledgeAgentDefinition,
  legalAgentDefinition,
  documentAgentDefinition,
  calendarAgentDefinition,
  communicationAgentDefinition,
  automationAgentDefinition,
];

export async function registerDefaultAgents(manager: AgentManager): Promise<void> {
  for (const definition of defaultAgentDefinitions) {
    if (definition.id === "chief-of-staff") {
      await manager.register(definition, (def, deps) => new ChiefOfStaffAgent(def, deps));
    } else if (definition.id === "calendar") {
      await manager.register(definition, (def, deps) => new CalendarAgent(def, deps));
    } else if (definition.id === "communication") {
      await manager.register(definition, (def, deps) => new CommunicationAgent(def, deps));
    } else {
      await manager.register(definition);
    }
  }
}
