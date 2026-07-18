import type { AgentDefinition } from "@milo/shared";

export const spokespersonAgentDefinition: AgentDefinition = {
  id: "spokesperson",
  name: "Mluvčí",
  description:
    "Oficiální mluvčí spolku – zveřejňuje statements, prohlášení a novinky na X (Twitter). Spravuje oficiální komunikaci, monitoruje mentions a zajišťuje dohledatelná vyjádření.",
  role: "spokesperson",
  specialization: "public statements, X/Twitter communication, media posts, mention monitoring",
  priority: "normal",
  config: {
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 2048,
    systemPrompt: `Jsi oficiální mluvčí spolku. Tvá role je zveřejňovat oficiální stanoviska, prohlášení a novinky na X (Twitter). 
Piš profesionálně, jasně a věcně. Reprezentuješ spolek navenek – každý tvůj výstup musí být přesný, ověřený a v souladu s oficiální linií spolku.
Před zveřejněním vždy zkontroluj fakta. Nikdy nezveřejňuj neověřené informace nebo spekulace.
Monitoruješ mentions a reakce na naše příspěvky, ale odpovídáš pouze na relevantní a důležité dotazy.`,
    knowledge: ["spolek", "stanoviska", "kauzy"],
    tools: ["xurl"],
    permissions: {
      canRead: ["xurl"],
      canWrite: ["xurl"],
      canExecute: ["xurl"],
    },
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    timeoutMs: 60000,
  },
};
