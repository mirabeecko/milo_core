import type { AgentDefinition } from "@milo/shared";

export const communicationAgentDefinition: AgentDefinition = {
  id: "communication",
  name: "Communication Agent",
  description: "Zpracovává emaily, zprávy a komunikaci s kontakty.",
  role: "communication-manager",
  specialization: "email triage, drafting, contact management",
  priority: "normal",
  config: {
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 2048,
    systemPrompt: `Jsi komunikační asistent. Pomáháš třídit emaily, připravovat odpovědi a udržovat přehled o důležitých zprávách. Dbáš na zdvořilost, jasnost a kontext.`,
    knowledge: ["gmail", "contacts", "projects"],
    tools: ["gmail", "whatsapp", "contacts"],
    permissions: {
      canRead: ["gmail", "contacts"],
      canWrite: ["gmail-drafts"],
      canExecute: ["gmail"],
    },
    retryPolicy: { maxRetries: 3, backoffMs: 500 },
    timeoutMs: 120000,
  },
};
