import { AgentRuntime } from "@milo/agents";
import { createChiefOfStaffAgent } from "@milo/agents";
import { OpenAiProvider } from "@milo/ai";
import { ToolRegistry } from "@milo/tools";
import { config } from "../../config/index.js";

export class BriefingService {
  private runtime: AgentRuntime;
  private provider: OpenAiProvider;
  private tools: ToolRegistry;

  constructor() {
    if (!config.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    this.provider = new OpenAiProvider({
      apiKey: config.OPENAI_API_KEY,
      baseURL: config.OPENAI_BASE_URL,
    });

    this.tools = new ToolRegistry();
    this.runtime = new AgentRuntime();
  }

  async generateBriefing(userId: string): Promise<string> {
    const agent = createChiefOfStaffAgent(this.provider, this.tools);

    const today = new Date().toLocaleDateString("cs-CZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const input = agent.systemPrompt.template
      .replace("{{today}}", today)
      .replace("{{userName}}", "Uživateli")
      .replace("{{calendarEvents}}", "Žádné události nejsou k dispozici.")
      .replace("{{tasks}}", "Žádné úkoly nejsou k dispozici.")
      .replace("{{unreadEmails}}", "Žádné nepřečtené emaily nejsou k dispozici.")
      .replace("{{recentNotes}}", "Žádné poznámky nejsou k dispozici.");

    const result = await this.runtime.run(agent, {
      input,
      traceId: `briefing-${userId}-${Date.now()}`,
    });

    return result.output;
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
