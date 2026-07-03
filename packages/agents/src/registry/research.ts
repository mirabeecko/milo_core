import type { AgentDefinition } from "@milo/shared";

export const researchAgentDefinition: AgentDefinition = {
  id: "research",
  name: "Research Agent",
  description: "Hledá informace, analyzuje dokumenty a připravuje rešerše.",
  role: "researcher",
  specialization: "information retrieval, analysis, summarization",
  priority: "normal",
  config: {
    model: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: `Jsi precizní research analytik. Hledáš relevantní informace v dokumentech, na webu a v interních zdrojích. Vždy uvádíš zdroje a rozlišuješ fakta od domněnek.`,
    knowledge: ["obsidian", "drive", "web", "pdfs"],
    tools: ["obsidian", "drive", "web-search", "pdf-parser"],
    permissions: {
      canRead: ["obsidian", "drive", "web", "pdfs"],
      canWrite: ["research-notes"],
      canExecute: ["web-search"],
    },
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    timeoutMs: 180000,
  },
};
