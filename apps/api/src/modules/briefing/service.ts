import { getProjects } from "../projects/service.js";
import { getAiSettings, type TaskComplexity } from "../../config/settings.js";
import { config } from "../../config/index.js";
import { logUsage, calculateCost } from "../usage/service.js";

interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callLlm(
  messages: LlmMessage[],
  complexity: TaskComplexity = "standard",
): Promise<string> {
  const settings = await getAiSettings();
  const modelConfig = settings.models?.[complexity];

  if (!modelConfig) {
    throw new Error(`No model configured for complexity: ${complexity}`);
  }

  const apiKey = modelConfig.apiKey || config.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("No API key configured");
  }

  const provider = modelConfig.provider;
  const model = modelConfig.model;

  let url: string;
  let headers: Record<string, string>;

  if (provider === "openai") {
    url = modelConfig.baseUrl ? `${modelConfig.baseUrl}/v1/chat/completions` : "https://api.openai.com/v1/chat/completions";
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
  } else if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
  } else if (provider === "google") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    headers = { "Content-Type": "application/json" };
  } else {
    url = `https://api.moonshot.cn/v1/chat/completions`;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
  }

  const startTime = Date.now();

  let body: string;
  let response: Response;

  if (provider === "anthropic") {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role !== "system");
    body = JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMsg?.content,
      messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
    });
  } else if (provider === "google") {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsg = messages.find((m) => m.role === "user");
    const parts = [];
    if (systemMsg) parts.push({ text: systemMsg.content });
    if (userMsg) parts.push({ text: userMsg.content });
    body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 4096 },
    });
  } else {
    body = JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    });
  }

  response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  const durationMinutes = (Date.now() - startTime) / 60000;
  const cost = calculateCost(model, durationMinutes);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`LLM error (${provider}/${model}): ${response.status} ${errorText}`);
    throw new Error(`LLM error: ${response.status}`);
  }

  const data = await response.json() as Record<string, unknown>;

  let result: string;
  if (provider === "anthropic") {
    const content = (data as Record<string, unknown>).content as Array<{ text: string }> | undefined;
    result = content?.[0]?.text || "";
  } else if (provider === "google") {
    const candidates = (data as Record<string, unknown>).candidates as Array<Record<string, unknown>> | undefined;
    const parts = (candidates?.[0] as Record<string, unknown> | undefined);
    const content = parts?.content as Record<string, unknown> | undefined;
    const contentParts = content?.parts as Array<{ text: string }> | undefined;
    result = contentParts?.[0]?.text || "";
  } else {
    const choices = (data as Record<string, unknown>).choices as Array<Record<string, unknown>> | undefined;
    const choice = choices?.[0] as Record<string, unknown> | undefined;
    const message = choice?.message as { content: string } | undefined;
    result = message?.content || "";
  }

  await logUsage({
    project: "MiLO_Core",
    agent: "briefing",
    model,
    provider,
    minutes: Math.round(durationMinutes * 100) / 100,
    cost_usd: cost,
    task_description: `Briefing generation (${complexity})`,
    timestamp: new Date().toISOString(),
  });

  return result;
}

function generateDataBriefing(): string {
  const today = new Date().toLocaleDateString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const projects = getProjects();
  const activeProjects = projects.filter((p) => p.status !== "done" && p.status !== "archived");
  const criticalProjects = projects.filter((p) => p.priority === "critical" && p.status !== "done");
  const totalCommits = projects.reduce((sum, p) => sum + p.commit_count, 0);
  const totalHours = projects.reduce((sum, p) => sum + (p.time_spent_hours || 0), 0);

  const lines: string[] = [
    `# Briefing pro ${today}`,
    "",
    "## Shrnutí dne",
    `Aktuálně pracuješ na **${activeProjects.length} projektech** (celkem ${projects.length}). ` +
    `Celkem **${totalCommits.toLocaleString("cs-CZ")} commitů**, **${totalHours}h** odvedené práce.` +
    `${criticalProjects.length > 0 ? ` ${criticalProjects.length} projektů má kritickou prioritu.` : ""}`,
    "",
    "## Aktivní projekty",
  ];

  for (const p of activeProjects.slice(0, 5)) {
    const statusEmoji = p.status === "active" ? "🟢" : p.status === "paused" ? "🟡" : "⚪";
    lines.push(
      `- ${statusEmoji} **${p.name}** – ${p.goal || (p.description || "bez popisu").slice(0, 80)} ` +
      `(${p.commit_count} commitů, ${p.time_spent_hours || 0}h)`,
    );
  }

  if (activeProjects.length > 5) {
    lines.push(`- *...a dalších ${activeProjects.length - 5} projektů*`);
  }

  lines.push("");
  lines.push("## Co vyžaduje pozornost");

  if (criticalProjects.length > 0) {
    for (const cp of criticalProjects.slice(0, 3)) {
      lines.push(`- 🔴 **${cp.name}** – kritická priorita, ${cp.commit_count} commitů`);
    }
  } else {
    lines.push("- Žádné kritické projekty – dobrá práce!");
  }

  lines.push("");
  lines.push("## Rychlé akce");
  lines.push("- [Otevřít Gmail](https://mail.google.com) – zkontrolovat nové e-maily");
  lines.push("- [Otevřít Kalendář](https://calendar.google.com) – přehled dnešních schůzek");
  lines.push("- [Projekty](/projects) – zobrazit všechny projekty");

  lines.push("");
  lines.push("## Nastavení AI");
  lines.push(
    "> Chceš personalizovaný briefing od AI? Nastav OpenAI API klíč v [Nastavení → AI](/settings). " +
    "Momentálně vidíš automaticky generovaný přehled z tvých projektových dat.",
  );

  return lines.join("\n");
}

export class BriefingService {
  async generateBriefing(): Promise<{ briefing: string; demo: boolean }> {
    const apiKey = config.OPENAI_API_KEY;
    const settings = await getAiSettings();
    const hasModel = settings.models?.standard?.apiKey || apiKey;

    if (!hasModel) {
      return { briefing: generateDataBriefing(), demo: true };
    }

    try {
      const projects = getProjects();
      const projectSummary = projects
        .slice(0, 15)
        .map((p) =>
          `- **${p.name}**: ${p.goal || "bez cíle"} (stav: ${p.status}, ` +
          `${p.commit_count} commitů, ${p.time_spent_hours || 0}h, priorita: ${p.priority})`,
        )
        .join("\n");

      const systemPrompt = `Jsi Chief of Staff – osobní AI asistent. Tvoje role: každé ráno připravit strukturovaný briefing v češtině.
Buď stručný, věcný, konkrétní. Používej markdown formátování. Vždy přidej na konec sekci s odkazem: [Otevřít Gmail](https://mail.google.com).`;

      const userPrompt = `Připrav denní briefing na dnešek (${new Date().toLocaleDateString("cs-CZ")}).

## Aktuální projekty:
${projectSummary || "Žádné projekty"}

## Formát briefingu:
# Briefing pro [datum]

## Shrnutí dne
[2-3 věty o tom, co je dnes důležité]

## Top 3 priority
1. [nejdůležitější úkol]
2. [druhý nejdůležitější úkol]
3. [třetí nejdůležitější úkol]

## Stav projektů
[stručný přehled – co se děje, co je potřeba]

## Co vyžaduje moji pozornost
[co potřebuje rozhodnutí nebo akci]

## Doporučení
[1-2 konkrétní doporučení na dnešek]

## Rychlé odkazy
- [Otevřít Gmail](https://mail.google.com) – zkontrolovat e-maily
- [Otevřít Kalendář](https://calendar.google.com) – přehled schůzek
`;

      const briefing = await callLlm(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        "standard",
      );

      return { briefing, demo: false };
    } catch (error) {
      console.error("Failed to generate briefing with LLM:", error);
      return { briefing: generateDataBriefing(), demo: true };
    }
  }
}
