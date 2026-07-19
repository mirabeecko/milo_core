import type { AgentManager } from "@milo/agents";
import type { AiMessage, AiProvider, ModelRouter } from "@milo/ai";
import type { CreateMissionInput } from "@milo/shared";

export interface CommandResult {
  text: string;
  sources: string[];
  suggestedActions: string[];
  missionId?: string;
}

type Intent =
  | "research"
  | "briefing"
  | "chat"
  | "agent_status"
  | "task_create"
  | "calendar"
  | "email"
  | "help";

const INTENT_CLASSIFICATION_PROMPT = `Jsi klasifikátor záměrů pro osobního AI asistenta jménem MiLO. Tvým úkolem je zařadit uživatelskou zprávu do jedné z následujících kategorií.

Kategorie:
- research: hledání informací, dokumentů, souborů, rešerše, zjišťování faktů
- briefing: denní souhrn, co je dnes na programu, přehled priorit
- chat: běžná konverzace, otázky, povídání, pozdravy
- agent_status: dotazy na stav agentů, co agenti dělají
- task_create: vytvoření nového úkolu, zadání práce
- calendar: kalendář, schůzky, plánování času
- email: e-maily, zprávy, komunikace
- help: dotaz na to, co MiLO umí, nápověda

Odpověz POUZE jedním slovem - názvem kategorie. Žádné další vysvětlení.`;

const CHAT_SYSTEM_PROMPT = `Jsi MiLO, osobní AI asistent. Jsi přátelský, profesionální a nápomocný. Odpovídáš česky.

Tvé schopnosti:
- Vyhledávání v dokumentech a znalostní bázi
- Správa úkolů a priorit
- Plánování kalendáře a schůzek
- Správa e-mailů a komunikace
- Koordinace agentů (Chief of Staff, Research Agent, Calendar Agent, Communication Agent, Developer Agent)
- Denní briefingy a souhrny

Odpovídej stručně, jasně a k věci. Když něco nevíš, řekni to na rovinu.`;

export class CommandProcessor {
  constructor(
    private manager?: AgentManager,
    private modelRouter?: ModelRouter,
  ) {}

  async process(
    message: string,
    history?: AiMessage[],
  ): Promise<CommandResult> {
    const intent = await this.classifyIntent(message);

    switch (intent) {
      case "research":
        return this.createMissionFromQuery(message);
      case "briefing":
        return this.handleBriefing();
      case "chat":
        return this.handleChat(message, history);
      case "agent_status":
        return this.handleAgentStatus();
      case "task_create":
        return this.handleTaskCreate(message);
      case "calendar":
        return this.handleCalendar();
      case "email":
        return this.handleEmail();
      case "help":
        return this.handleHelp();
      default:
        return this.handleChat(message, history);
    }
  }

  private async classifyIntent(message: string): Promise<Intent> {
    const ai = this.getProvider();
    if (!ai) {
      return this.classifyIntentFallback(message);
    }

    try {
      const response = await ai.complete(
        [
          { role: "system", content: INTENT_CLASSIFICATION_PROMPT },
          { role: "user", content: message },
        ],
        { temperature: 0, maxTokens: 20 },
      );

      const label = response.trim().toLowerCase() as Intent;
      const validIntents: Intent[] = [
        "research",
        "briefing",
        "chat",
        "agent_status",
        "task_create",
        "calendar",
        "email",
        "help",
      ];

      if (validIntents.includes(label)) {
        return label;
      }

      return this.classifyIntentFallback(message);
    } catch {
      return this.classifyIntentFallback(message);
    }
  }

  private classifyIntentFallback(message: string): Intent {
    const lower = message.toLowerCase();

    if (this.looksLikeResearchQuery(lower)) return "research";

    if (lower.includes("priorit") || lower.includes("co dnes") || lower.includes("briefing") || lower.includes("shrnutí") || lower.includes("přehled")) {
      return "briefing";
    }

    if (lower.includes("agent") || lower.includes("co udělali") || lower.includes("co děláš") || lower.includes("stav")) {
      return "agent_status";
    }

    if (lower.includes("úkol") || lower.includes("vytvoř") || lower.includes("zadej") || lower.includes("přidej") || lower.includes("nový")) {
      return "task_create";
    }

    if (lower.includes("kalendář") || lower.includes("schůz") || lower.includes("čas") || lower.includes("termín") || lower.includes("den")) {
      return "calendar";
    }

    if (lower.includes("mail") || lower.includes("e-mail") || lower.includes("zpráv")) {
      return "email";
    }

    if (lower.includes("pomoc") || lower.includes("help") || lower.includes("co umíš") || lower.includes("návod")) {
      return "help";
    }

    return "chat";
  }

  private getProvider(): AiProvider | null {
    if (!this.modelRouter) return null;

    try {
      return this.modelRouter.getProvider("chat");
    } catch {
      try {
        return this.modelRouter.getProvider();
      } catch {
        return null;
      }
    }
  }

  private async handleChat(
    message: string,
    history?: AiMessage[],
  ): Promise<CommandResult> {
    const ai = this.getProvider();
    if (!ai) {
      return this.generateFallbackResponse(message);
    }

    try {
      const messages: AiMessage[] = [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        ...(history ?? []).slice(-20),
        { role: "user", content: message },
      ];

      let responseText = "";
      for await (const chunk of ai.stream(messages, {
        temperature: 0.7,
        maxTokens: 800,
      })) {
        responseText += chunk;
      }

      return {
        text: responseText.trim(),
        sources: ["MiLO AI"],
        suggestedActions: [
          "Vytvořit úkol",
          "Najdi dokumenty ke kauze TJ Krupka.",
          "Co mám dnes na programu?",
        ],
      };
    } catch {
      return this.generateFallbackResponse(message);
    }
  }

  private handleBriefing(): CommandResult {
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

  private handleAgentStatus(): CommandResult {
    return {
      text: `Aktuální stav agentů zobrazíš v dashboardu Agent Operating Center. Chief of Staff a Research Agent jsou aktivní.`,
      sources: ["Agent Logs"],
      suggestedActions: ["Zobrazit agenty"],
    };
  }

  private handleTaskCreate(message: string): CommandResult {
    return {
      text: `Rozumím, chceš vytvořit nový úkol. Pro upřesnění: jakou má mít prioritu (kritická/důležitá/nízká) a jaký je deadline?

Prozatím jsem zaznamenal: "${message}"`,
      sources: [],
      suggestedActions: ["Vytvořit úkol v dashboardu", "Zobrazit existující úkoly"],
    };
  }

  private handleCalendar(): CommandResult {
    return {
      text: `Kalendář spravuje Calendar Agent. Můžu ti ukázat dnešní přehled, najít volné termíny nebo zkontrolovat kolize.

Co přesně potřebuješ?`,
      sources: ["Calendar Agent"],
      suggestedActions: ["Zobrazit dnešní kalendář", "Naplánovat schůzku", "Najít volný termín"],
    };
  }

  private handleEmail(): CommandResult {
    return {
      text: `E-maily spravuje Communication Agent. Můžu ti ukázat nepřečtené zprávy, navrhnout odpovědi nebo vytáhnout úkoly z e-mailů.

Co přesně potřebuješ?`,
      sources: ["Communication Agent"],
      suggestedActions: ["Zobrazit nepřečtené e-maily", "Vygenerovat shrnutí"],
    };
  }

  private handleHelp(): CommandResult {
    return {
      text: `Jsem MiLO, tvůj osobní AI asistent. Tady je přehled toho, co umím:

- **Vyhledávání** – najdu dokumenty, smlouvy, poznámky napříč celou tvou znalostní bází
- **Priority a úkoly** – pomůžu ti zorganizovat den a vytvořit úkoly
- **Kalendář** – přes Calendar Agenta spravuju schůzky, hlídám kolize a navrhuju focus time
- **Komunikace** – přes Communication Agenta třídím e-maily, navrhuju odpovědi a hlídám důležité zprávy
- **Agenti** – koordinuju tým specializovaných agentů (Chief of Staff, Research, Calendar, Communication, Developer, Legal, Document)
- **Denní briefing** – každé ráno připravím přehled priorit a toho, co tě čeká

Zkus napsat například:
- "Najdi všechny dokumenty ke kauze TJ Krupka"
- "Jaké mám dnes priority?"
- "Vytvoř úkol: připravit nabídku pro Komárku"`,
      sources: ["MiLO"],
      suggestedActions: [
        "Najdi dokumenty ke kauze TJ Krupka.",
        "Co mám dnes na programu?",
        "Zobrazit všechny agenty",
      ],
    };
  }

  private looksLikeResearchQuery(input: string): boolean {
    const researchKeywords = [
      "najdi",
      "hledej",
      "vyhledej",
      "najděte",
      "hledejte",
      "vyhledejte",
      "zjisti",
      "rešerše",
      "dokumenty",
      "smlouvy",
      "poznámky",
      "soubory",
      "předpověď",
      "počasí",
      "vítr",
      "větru",
      "teplota",
      "find",
      "search",
      "look up",
      "weather",
      "forecast",
      "wind",
      "temperature",
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
