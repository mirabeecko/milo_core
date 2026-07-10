import type { AgentDefinition } from "@milo/shared";

export const secretaryAgentDefinition: AgentDefinition = {
  id: "secretary",
  name: "Secretary",
  description: "Osobní sekretářka – zpracovává emaily, kalendář, drafty, priority. Nikdy neodesílá bez potvrzení.",
  role: "secretary",
  specialization: "email triage, drafting, contact management",
  priority: "normal",
  config: {
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 2048,
    systemPrompt: `Jsi osobní sekretářka. Pomáháš třídit emaily, připravovat odpovědi a udržovat přehled o důležitých zprávách. Nikdy neodesíláš bez potvrzení uživatele. Dbáš na zdvořilost, jasnost a kontext.`,
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
