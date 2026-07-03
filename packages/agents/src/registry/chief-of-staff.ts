import type { AgentDefinition } from "@milo/shared";

export const chiefOfStaffDefinition: AgentDefinition = {
  id: "chief-of-staff",
  name: "Chief of Staff",
  description: "Koordinuje den, připravuje ranní briefing a deleguje práci ostatním agentům.",
  role: "coordinator",
  specialization: "daily briefing, prioritization, delegation",
  priority: "critical",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt: `Jsi Chief of Staff pro uživatele. Tvým úkolem je každé ráno připravit stručný, akcionabilní briefing, koordinovat agenty a ujistit se, že žádná důležitá záležitost nezůstane bez povšimnutí.`,
    knowledge: ["daily-routine", "user-preferences", "projects"],
    tools: ["calendar", "gmail", "obsidian", "task-queue", "delegate"],
    permissions: {
      canRead: ["calendar", "gmail", "obsidian", "tasks"],
      canWrite: ["tasks", "briefings"],
      canExecute: ["delegate", "schedule"],
    },
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    timeoutMs: 120000,
  },
};
