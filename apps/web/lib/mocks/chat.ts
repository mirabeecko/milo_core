export function generateMockReply(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("priorit") || lower.includes("co dnes")) {
    return `Dnes máš 3 hlavní priority:

1. **Kritická**: Dokončit návrh smlouvy pro TJ Krupka (do 12:00)
2. **Důležitá**: Projít feedback k MiLO_Core dashboardu
3. **Může počkat**: Připravit nabídku pro Komárku

Doporučuji začít kritickou prioritou, protože má nejbližší deadline.`;
  }

  if (lower.includes("dokument") || lower.includes("tj krupka")) {
    return `Našel jsem 3 dokumenty související s TJ Krupka:

- Smlouva TJ Krupka 2026 (Obsidian)
- ISDS: Doručenka 123456
- Ninja Týden rozpočet (Google Drive)

Chceš, abych otevřel konkrétní dokument nebo připravil shrnutí?`;
  }

  if (lower.includes("agent") || lower.includes("co udělali")) {
    return `Aktuální stav agentů:

- **Chief of Staff**: vygeneroval ranní briefing v 7:00
- **Research Agent**: indexoval 127 poznámek z Obsidianu
- **Legal Agent**: čeká na úkol
- **Developer Agent**: pozastaveno
- **Knowledge Agent**: čeká na úkol

2 položky čekají na tvé rozhodnutí.`;
  }

  return `Rozumím. Zatím pracuji s mock daty, ale struktura chatu je připravená na napojení reálného LLM.

Můžeš se zeptat například:
- Co dnes musím řešit?
- Najdi dokumenty ke kauze TJ Krupka.
- Co udělali agenti?`;
}

export const chatSuggestions = [
  "Co dnes musím řešit?",
  "Najdi dokumenty ke kauze TJ Krupka.",
  "Připrav mi priority dne.",
  "Co udělali agenti?",
];

export const initialChatMessages = [
  {
    id: "msg-0",
    role: "assistant" as const,
    content: "Dobré ráno. Jsem MiLO. Co pro tebe mohu udělat?",
    timestamp: "2026-07-03T07:00:00Z",
  },
];
