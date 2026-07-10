import type { AgentDefinition } from "@milo/shared";

export const notifierAgentDefinition: AgentDefinition = {
  id: "notifier",
  name: "Notifier",
  description: "Hlídá připomínky – kalendář, úkoly, důležité emaily. Posílá notifikace v nastavených časech.",
  role: "notifier",
  specialization: "reminders, notifications, deadline tracking",
  priority: "high",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 1024,
    systemPrompt: "Jsi notifikační agent. Hlídáš termíny, připomínky a důležité události. Proaktivně upozorňuješ uživatele na blížící se deadliny a schůzky.",
    knowledge: ["calendar", "tasks", "gmail"],
    tools: ["calendar", "tasks", "gmail", "notifications"],
    permissions: {
      canRead: ["calendar", "tasks", "gmail"],
      canWrite: ["notifications"],
      canExecute: ["notifications"],
    },
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    timeoutMs: 60000,
  },
};
