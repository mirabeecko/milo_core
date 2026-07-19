/**
 * Mapování slug → soubor v packages/agents/src/registry/
 */
export const AGENT_DEFINITION_FILES: Record<string, string> = {
  "tester-boss": "tester-boss.ts",
  "chief-of-staff": "chief-of-staff.ts",
  "research": "research.ts",
  "calendar": "calendar.ts",
  "secretary": "communication.ts",
  "design": "design.ts",
  "notifier": "notifier.ts",
  "knowledge": "knowledge.ts",
  "spokesperson": "spokesperson.ts",
  "spy-g": "spy-g.ts",
  "phone-tracker": "phone-tracker.ts",
  "developer": "developer.ts",
  "document": "document.ts",
  "legal": "legal.ts",
  "automation": "automation.ts",
};

/** Pole, která lze editovat přes API */
export const EDITABLE_FIELDS = [
  "name",
  "description",
  "role",
  "specialization",
  "priority",
  "model",
  "temperature",
  "systemPrompt",
  "tools",
  "knowledge",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

export interface DefinitionUpdate {
  name?: string;
  description?: string;
  role?: string;
  specialization?: string;
  priority?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  tools?: string[];
  knowledge?: string[];
}
