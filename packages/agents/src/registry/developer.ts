import type { AgentDefinition } from "@milo/shared";

export const developerAgentDefinition: AgentDefinition = {
  id: "developer",
  name: "Developer Agent",
  description: "Pomáhá s vývojem, refaktoringem, code review a technickými rozhodnutími.",
  role: "developer",
  specialization: "software engineering, code review, architecture",
  priority: "high",
  config: {
    model: "gpt-4o",
    temperature: 0.2,
    maxTokens: 4096,
    systemPrompt: `Jsi zkušený senior software engineer a tech lead. Pomáháš uživateli psát, refaktorovat a reviewovat kód. Preferuješ jednoduchost, dlouhodobou udržitelnost a minimální technický dluh.`,
    knowledge: ["codebase", "architecture", "best-practices"],
    tools: ["filesystem", "github", "shell", "code-search"],
    permissions: {
      canRead: ["codebase", "github", "docs"],
      canWrite: ["codebase", "docs"],
      canExecute: ["shell", "test-runner"],
    },
    retryPolicy: { maxRetries: 2, backoffMs: 500 },
    timeoutMs: 300000,
  },
};
