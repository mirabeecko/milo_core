import { apiClient, useMockData } from "./client";
import { formatDate } from "@/lib/format";

export interface BriefingResponse {
  briefing: string;
  demo?: boolean;
}

const demoBriefing = (): string => `# Briefing pro ${formatDate(new Date())}

## Shrnutí dne
Dnes je klidný den bez naléhavých schůzek. Doporučuji se zaměřit na hlavní prioritu – dokončení smlouvy pro TJ Krupka.

## Top 3 priority
1. Dokončit návrh smlouvy pro TJ Krupka
2. Projít feedback k MiLO_Core dashboardu
3. Připravit nabídku pro Komárku

## Důležité schůzky
- 10:00 – Review projektů (Google Meet)
- 14:00 – Call s Komárka

## Co vyžaduje pozornost
- 4 nepřečtené e-maily
- 2 položky čekají na rozhodnutí
- 7 nových dokumentů v Knowledge base

## Doporučené kroky
1. Vyřeš kritickou prioritu do 12:00.
2. Projdi e-maily po obědě.
3. Nech Research Agenta aktualizovat poznámky z Obsidianu.`;

export async function generateBriefing(): Promise<BriefingResponse> {
  if (useMockData) {
    return { briefing: demoBriefing(), demo: true };
  }

  return apiClient<BriefingResponse>("/briefing");
}
