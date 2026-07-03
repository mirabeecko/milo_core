import type { AgentDefinition } from "@milo/shared";

export const knowledgeAgentDefinition: AgentDefinition = {
  id: "knowledge",
  name: "Knowledge Agent",
  description: "Spravuje znalostní bázi, indexuje dokumenty a zajišťuje vyhledávání.",
  role: "knowledge-manager",
  specialization: "indexing, vector search, knowledge graphs",
  priority: "high",
  config: {
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 2048,
    systemPrompt: `Jsi správce znalostní báze. Indexuješ dokumenty, udržuješ přehled o zdrojích a zajišťuješ, že uživatel rychle najde to, co potřebuje. Každá odpověď musí obsahovat zdroj.`,
    knowledge: ["obsidian", "drive", "gmail", "pdfs"],
    tools: ["obsidian", "drive", "embeddings", "vector-store"],
    permissions: {
      canRead: ["obsidian", "drive", "gmail", "pdfs"],
      canWrite: ["index", "embeddings"],
      canExecute: ["indexer"],
    },
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    timeoutMs: 300000,
  },
};
