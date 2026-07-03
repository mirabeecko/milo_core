import { OpenAiProvider } from "@milo/ai";
import { config } from "../../config/index.js";

export interface CommandResult {
  text: string;
  sources: string[];
  suggestedActions: string[];
}

export class CommandProcessor {
  private provider: OpenAiProvider | null = null;
  private isDemo: boolean;

  constructor() {
    if (!config.OPENAI_API_KEY) {
      this.isDemo = true;
      return;
    }

    this.isDemo = false;
    this.provider = new OpenAiProvider({
      apiKey: config.OPENAI_API_KEY,
      baseURL: config.OPENAI_BASE_URL,
    });
  }

  async process(message: string): Promise<CommandResult> {
    if (this.isDemo || !this.provider) {
      return this.generateMockResponse(message);
    }

    const reply = await this.provider.complete([
      {
        role: "system",
        content:
          "Jsi MiLO, osobní operační systém uživatele. Odpovídej stručně, jasně a v češtině. Pokud odpovíš na základě dokumentů nebo dat, uveď zdroje.",
      },
      { role: "user", content: message },
    ]);

    return {
      text: reply,
      sources: [],
      suggestedActions: [],
    };
  }

  isInDemoMode(): boolean {
    return this.isDemo;
  }

  private generateMockResponse(input: string): CommandResult {
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

    if (lower.includes("dokument") || lower.includes("tj krupka")) {
      return {
        text: `Našel jsem 3 dokumenty související s TJ Krupka:

- Smlouva TJ Krupka 2026 (Obsidian)
- ISDS: Doručenka 123456
- Ninja Týden rozpočet (Google Drive)

Chceš, abych otevřel konkrétní dokument nebo připravil shrnutí?`,
        sources: ["Obsidian", "ISDS", "Google Drive"],
        suggestedActions: ["Otevřít smlouvu", "Shrnutí kauzy TJ Krupka"],
      };
    }

    if (lower.includes("agent") || lower.includes("co udělali")) {
      return {
        text: `Aktuální stav agentů:

- **Chief of Staff**: vygeneroval ranní briefing v 7:00
- **Research Agent**: indexoval 127 poznámek z Obsidianu
- **Legal Agent**: čeká na úkol
- **Developer Agent**: pozastaveno
- **Knowledge Agent**: čeká na úkol

2 položky čekají na tvé rozhodnutí.`,
        sources: ["Agent Logs"],
        suggestedActions: ["Zobrazit agenty", "Zobrazit rozhodnutí"],
      };
    }

    return {
      text: `Rozumím. Zatím pracuji s mock daty, ale struktura chatu je připravená na napojení reálného LLM.

Můžeš se zeptat například:
- Co dnes musím řešit?
- Najdi dokumenty ke kauze TJ Krupka.
- Co udělali agenti?`,
      sources: [],
      suggestedActions: [
        "Co dnes musím řešit?",
        "Najdi dokumenty ke kauze TJ Krupka.",
        "Co udělali agenti?",
      ],
    };
  }
}
