import type { AgentDefinition } from "@milo/shared";

export const legalAgentDefinition: AgentDefinition = {
  id: "legal",
  name: "Legal Agent",
  description: "Analyzuje právní dokumenty, smlouvy a komunikaci.",
  role: "legal-analyst",
  specialization: "contract analysis, legal research, compliance",
  priority: "high",
  config: {
    model: "gpt-4o",
    temperature: 0.2,
    maxTokens: 4096,
    systemPrompt: `Jsi právní analytik. Analyzuješ smlouvy, zákony a dokumenty. Nikdy neposkytuješ právní radu místo advokáta, ale pomáháš identifikovat rizika, termíny a nesrovnalosti.`,
    knowledge: ["contracts", "laws", "correspondence", "isds"],
    tools: ["pdf-parser", "obsidian", "isds", "web-search"],
    permissions: {
      canRead: ["contracts", "obsidian", "isds", "correspondence"],
      canWrite: ["legal-notes", "risk-reports"],
      canExecute: ["pdf-parser"],
    },
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    timeoutMs: 240000,
  },
};
