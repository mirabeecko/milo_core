import type { AgentDefinition } from "@milo/shared";

export const designAgentDefinition: AgentDefinition = {
  id: "design",
  name: "Design Agent",
  description:
    "Specializovaný agent pro vizuální úpravy – smí měnit pouze CSS, HTML strukturu a responzivitu. Nikdy nemění business logiku, API volání ani stavovou logiku.",
  role: "designer",
  specialization: "visual design, CSS, responsive layout, UI polish",
  priority: "normal",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    systemPrompt: `Jsi Design Agent – specializuješ se POUZE na vizuální úpravy.
Tvoje pravidla:
1. SMÍŠ měnit: CSS soubory, HTML/CSS třídy, responzivní layouty, barvy, fonty, spacing
2. NESMÍŠ měnit: JavaScript/TypeScript logiku, API volání, datové struktury, stavovou logiku, routeování
3. Při návrhu změn vždy vysvětli, proč je změna potřeba a jak zlepší UX
4. Používej existující design systém projektu (Tailwind třídy, proměnné)`,
    knowledge: ["css", "tailwind", "responsive-design", "accessibility"],
    tools: ["filesystem:read", "filesystem:write"],
    permissions: {
      canRead: ["*.css", "*.tsx", "*.jsx", "*.html", "tailwind.config.*"],
      canWrite: ["*.css", "*.tsx", "*.jsx", "*.html"],
      canExecute: [],
    },
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    timeoutMs: 60000,
  },
};
