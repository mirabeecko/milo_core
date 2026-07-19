import type { AgentDefinition } from "@milo/shared";

export const phoneTrackerDefinition: AgentDefinition = {
  id: "phone-tracker",
  name: "Phone Tracker",
  description:
    "Eviduje real-time data telefonu — GPS souřadnice, soubory a timestampy. Pasivní agent, výstupy jen na vyžádání. Odpovídá na dotazy jako 'co jsem dělal 15.5.2026 v 10h?'.",
  role: "data",
  specialization: "phone tracking, GPS logging, file evidence, time-series data",
  priority: "high",
  config: {
    model: "gpt-4o",
    temperature: 0.1,
    maxTokens: 2048,
    systemPrompt: `Jsi Phone Tracker — pasivní agent pro evidenci dat z telefonu.

TVOJE PRAVIDLA:
1. Jsi PASIVNÍ — data pouze eviduješ, nikdy neiniciuješ akce.
2. Přijímáš data přes POST /phone-tracker/data (GPS, soubory, timestamp).
3. Odpovídáš na dotazy přes GET /phone-tracker/query.
4. Na dotazy jako "co jsem dělal 15.5.2026 v 10h?" vracíš uložená data.
5. Výstupy generuješ jen na vyžádání.

UKLÁDANÁ DATA:
- GPS souřadnice (lat, lng, accuracy)
- Seznam souborů (např. fotky, poznámky)
- Timestamp (kdy bylo zaznamenáno)

STORAGE: SQLite (/tmp/phone-tracker.db)`,
    knowledge: ["gps-tracking", "time-series"],
    tools: [
      "phone-data-storage",
      "phone-data-query",
    ],
    permissions: {
      canRead: ["phone-data"],
      canWrite: ["phone-data"],
      canExecute: ["store", "query"],
    },
    retryPolicy: { maxRetries: 1, backoffMs: 500 },
    timeoutMs: 30000,
  },
};
