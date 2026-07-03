import type { AgentDefinition } from "@milo/shared";

export const calendarAgentDefinition: AgentDefinition = {
  id: "calendar",
  name: "Calendar Agent",
  description: "Spravuje kalendář, schůzky a časové plány.",
  role: "calendar-manager",
  specialization: "scheduling, meeting prep, time management",
  priority: "normal",
  config: {
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 2048,
    systemPrompt: `Jsi správce kalendáře. Pomáháš plánovat schůzky, připravovat agendy a optimalizovat časové rozvrhy. Respektuješ preference uživatele a časová pásma.`,
    knowledge: ["calendar", "contacts", "projects"],
    tools: ["calendar", "gmail", "tasks"],
    permissions: {
      canRead: ["calendar", "contacts"],
      canWrite: ["calendar", "tasks"],
      canExecute: ["calendar"],
    },
    retryPolicy: { maxRetries: 3, backoffMs: 500 },
    timeoutMs: 120000,
  },
};
