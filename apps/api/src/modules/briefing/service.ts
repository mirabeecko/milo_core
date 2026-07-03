import { config } from "../../config/index.js";

export class BriefingService {
  private isDemo: boolean;

  constructor() {
    this.isDemo = !config.OPENAI_API_KEY;
  }

  async generateBriefing(_userId: string): Promise<string> {
    if (this.isDemo) {
      return this.generateDemoBriefing();
    }

    // TODO: napojit na AgentManager a Chief of Staff agenta (M3)
    return this.generateDemoBriefing();
  }

  async generateDemoBriefing(): Promise<string> {
    const today = new Date().toLocaleDateString("cs-CZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return [
      `# Briefing pro ${today}`,
      "",
      "## Shrnutí dne",
      "Dnes je klidný den bez naléhavých schůzek. Doporučuji se zaměřit na hlavní prioritu.",
      "",
      "## Top 3 priority",
      "1. Dokončit nastavení MiLO",
      "2. Propojit Gmail a Calendar",
      "3. Prohlédnout si Knowledge base",
      "",
      "## Důležité schůzky",
      "Žádné schůzky nejsou naplánovány.",
      "",
      "## Co vyžaduje pozornost",
      "Žádné nepřečtené emaily ani upozornění.",
    ].join("\n");
  }
}
