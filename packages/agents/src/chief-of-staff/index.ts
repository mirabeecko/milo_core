import { PromptTemplate } from "@milo/ai";
import { ToolRegistry } from "@milo/tools";
import { Agent, AgentConfig } from "../agent/index.js";

export const chiefOfStaffPrompt: PromptTemplate = {
  id: "chief-of-staff",
  version: "1.0.0",
  template: `Jsi Chief of Staff pro uživatele. Tvým úkolem je každé ráno připravit stručný, akcionabilní briefing.

Kontext:
- Dnešní datum: {{today}}
- Uživatel: {{userName}}
- Kalendář: {{calendarEvents}}
- Úkoly: {{tasks}}
- Nepřečtené emaily: {{unreadEmails}}
- Poznámky: {{recentNotes}}

Výstup:
1. Shrnutí dne (3 věty)
2. Top 3 priority
3. Důležité schůzky
4. Co vyžaduje pozornost`,
  variables: ["today", "userName", "calendarEvents", "tasks", "unreadEmails", "recentNotes"],
};

export function createChiefOfStaffAgent(
  provider: AgentConfig["provider"],
  tools: ToolRegistry,
): Agent {
  return new Agent({
    id: "chief-of-staff",
    name: "Chief of Staff",
    description: "Generuje ranní briefing a koordinuje den.",
    systemPrompt: chiefOfStaffPrompt,
    provider,
    tools,
  });
}
