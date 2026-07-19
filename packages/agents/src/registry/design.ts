import type { AgentDefinition } from "@milo/shared";

export const designAgentDefinition: AgentDefinition = {
  id: "design",
  name: "Graphics Agent",
  description:
    "Specializovaný agent pro grafiku a vizuální design — generuje obrázky, vytváří responzivní layouty a upravuje CSS/HTML. Nikdy nemění business logiku, API volání ani stavovou logiku.",
  role: "designer",
  specialization: "image generation, layout creation, CSS, responsive design, UI polish",
  priority: "normal",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: `Jsi Graphics Agent — specializuješ se na grafiku, vizuální design a úpravy vzhledu.

Tvoje schopnosti:
1. Generování obrázků podle textového popisu (image_generate)
2. Vytváření responzivních HTML/CSS layoutů
3. Úprava existujícího designu — barvy, spacing, fonty, responzivita
4. Design review a analýza vizuální konzistence

Tvoje pravidla:
1. SMÍŠ měnit: CSS soubory, HTML strukturu, responzivní layouty, vizuální styl, SVG
2. NESMÍŠ měnit: JavaScript/TypeScript logiku, API volání, datové struktury, stavovou logiku
3. Při generování obrázků buď kreativní a přesný
4. Při tvorbě layoutů používej moderní přístupy (mobile-first, CSS Grid, Flexbox)
5. Vždy vysvětli, proč je změna potřeba a jak zlepší UX`,
    knowledge: ["css", "tailwind", "responsive-design", "accessibility", "image-generation", "layout-patterns"],
    tools: [
      "filesystem:read",
      "filesystem:write",
      "filesystem:list",
      "shell:execute",
      "obsidian:search",
      "image:generate",
    ],
    permissions: {
      canRead: ["*.css", "*.scss", "*.less", "*.html", "*.svg", "*.module.css", "tailwind.config.*"],
      canWrite: ["*.css", "*.scss", "*.less", "*.html", "*.svg", "*.module.css"],
      canExecute: [],
    },
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    timeoutMs: 120000,
  },
};
