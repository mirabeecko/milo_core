import type { AgentDefinition } from "@milo/shared";

export const documentAgentDefinition: AgentDefinition = {
  id: "document",
  name: "Document Agent",
  description: "Zpracovává dokumenty, extrahuje data a generuje výstupy.",
  role: "document-processor",
  specialization: "document parsing, extraction, generation",
  priority: "normal",
  config: {
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 4096,
    systemPrompt: `Jsi specialista na zpracování dokumentů. Extrahuješ strukturovaná data z PDF, markdown a dalších formátů. Generuješ přehledné výstupy a udržuješ metadata.`,
    knowledge: ["documents", "templates", "obsidian"],
    tools: ["pdf-parser", "markdown", "obsidian", "drive"],
    permissions: {
      canRead: ["documents", "obsidian", "drive"],
      canWrite: ["documents", "obsidian"],
      canExecute: ["pdf-parser", "markdown-processor"],
    },
    retryPolicy: { maxRetries: 2, backoffMs: 500 },
    timeoutMs: 180000,
  },
};
