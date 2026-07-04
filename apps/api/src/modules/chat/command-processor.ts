import type { AgentManager } from "@milo/agents";
import type { CreateMissionInput } from "@milo/shared";

export interface CommandResult {
  text: string;
  sources: string[];
  suggestedActions: string[];
  missionId?: string;
}

export class CommandProcessor {
  constructor(private manager?: AgentManager) {}

  async process(message: string): Promise<CommandResult> {
    const lower = message.toLowerCase();

    if (this.looksLikeResearchQuery(lower)) {
      return this.createMissionFromQuery(message);
    }

    return this.generateFallbackResponse(message);
  }

  private looksLikeResearchQuery(input: string): boolean {
    const researchKeywords = [
      "najdi",
      "hledej",
      "vyhledej",
      "najděte",
      "hledejte",
      "vyhledejte",
      "rešerše",
      "dokumenty",
      "smlouvy",
      "poznámky",
      "soubory",
      "find",
      "search",
      "look up",
    ];
    return researchKeywords.some((keyword) => input.includes(keyword));
  }

  private async createMissionFromQuery(message: string): Promise<CommandResult> {
    if (!this.manager) {
      return {
        text: "Agent manager není dostupný. Zprávu zpracuji lokálně.",
        sources: [],
        suggestedActions: ["Zkusit znovu"],
      };
    }

    const input: CreateMissionInput = {
      title: message,
      description: message,
      priority: "normal",
    };

    const mission = await this.manager.createMission(input);

    return {
      text: `Vytvořil jsem misi **${mission.title}**. Research Agent začal prohledávat dostupné zdroje. Výsledek se objeví v detailu mise.`,
      sources: ["Agent Runtime"],
      suggestedActions: ["Zobrazit mise", "Zobrazit agenty"],
      missionId: mission.id,
    };
  }

  private generateFallbackResponse(input: string): CommandResult {
    const lower = input.toLowerCase();

    if (lower.includes("priorit") || lower.includes("co dnes")) {
      return {
        text: `Dnes máš 3 hlavní priority:

1. **Kritická**: Dokončit návrh smlouvy pro TJ Krupka (do 12:00)
2. **Důležitá**: Projít feedback k MiLO_Core dashboardu
3. **Může počkat**: Připravit nabídku pro Komárku

Doporučuji začít kritickou prioritou, protože má nejbližší deadline.`,
        sources: ["MiLO Tasks", "Calendar"],
        suggestedActions: ["Zobrazit všechny úkoly", "Přidat novou prioritu"],
      };
    }

    if (lower.includes("agent") || lower.includes("co udělali")) {
      return {
        text: `Aktuální stav agentů zobrazíš v dashboardu Agent Operating Center. Chief of Staff a Research Agent jsou aktivní.`,
        sources: ["Agent Logs"],
        suggestedActions: ["Zobrazit agenty"],
      };
    }

    return {
      text: `Rozumím. Pro vyhledání dokumentů napiš například:

- Najdi všechny dokumenty týkající se Komárky.
- Hledej smlouvy s Lesy ČR.
- Najdi poznámky o TJ Krupka.`,
      sources: [],
      suggestedActions: [
        "Najdi dokumenty ke kauze TJ Krupka.",
        "Hledej smlouvy s Lesy ČR.",
        "Najdi poznámky o Komárce.",
      ],
    };
  }
}
