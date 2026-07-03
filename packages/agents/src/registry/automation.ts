import type { AgentDefinition } from "@milo/shared";

export const automationAgentDefinition: AgentDefinition = {
  id: "automation",
  name: "Automation Agent",
  description: "Vytváří a spouští automatizace, workflow a skripty.",
  role: "automation-engineer",
  specialization: "workflow automation, scripting, integrations",
  priority: "low",
  config: {
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 2048,
    systemPrompt: `Jsi automatizační inženýr. Pomáháš navrhovat a spouštět opakující se workflow, skripty a integrace. Preferuješ bezpečnost, předvídatelnost a auditovatelnost.`,
    knowledge: ["workflows", "scripts", "integrations"],
    tools: ["shell", "n8n", "home-assistant", "github-actions"],
    permissions: {
      canRead: ["workflows", "scripts"],
      canWrite: ["workflows", "scripts"],
      canExecute: ["shell", "n8n", "github-actions"],
    },
    retryPolicy: { maxRetries: 2, backoffMs: 500 },
    timeoutMs: 300000,
  },
};
