import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import type { AgentDefinition, AgentTask } from "@milo/shared";

export interface KnowledgeSearchRequest {
  query: string;
  topK?: number;
  filters?: {
    source?: string;
    tags?: string[];
  };
}

export interface KnowledgeSearchResultItem {
  docId: string;
  title: string;
  chunk: string;
  score: number;
  source: string;
  path: string;
  tags: string[];
  heading?: string;
}

export class KnowledgeAgent extends AgentEntityImpl {
  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async start(): Promise<void> {
    await super.start();
    this.setExplanation({
      currentActivity: "Jsem připraven spravovat znalostní bázi.",
      goal: "Indexovat dokumenty, generovat vektory a zajišťovat sémantické vyhledávání.",
      reason: "Knowledge Agent čeká na instrukci od Chief of Staff nebo uživatele.",
      findings: "Žádná aktivní úloha.",
      evidence: [],
      toolsUsed: this.agent.config.tools.slice(0, 5),
      nextStep: "Přijmout úkol a spustit indexaci nebo vyhledávání.",
      estimatedCompletion: "Neurčito",
      risks: "Žádné.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Inicializace",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });
  }

  async search(query: string, topK = 10): Promise<KnowledgeSearchResultItem[]> {
    this.setExplanation({
      ...this.explanation,
      currentActivity: `Vyhledávám: "${query}"`,
      goal: "Najít relevantní dokumenty pomocí hybridního vyhledávání.",
      reason: "Uživatel požádal o vyhledání informací.",
      findings: "Probíhá sémantické a fulltextové vyhledávání...",
      evidence: ["interní znalostní báze"],
      toolsUsed: ["embeddings", "vector-store", "obsidian"],
      nextStep: "Vrátit výsledky s relevancí a citacemi.",
      estimatedCompletion: "Několik vteřin",
      risks: "Nízké.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí dotazu",
      confidence: "85 %",
      alternativeApproach: "Fallback na fulltextové vyhledávání.",
    });

    const response = await fetch("/api/knowledge/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK }),
    });

    if (!response.ok) {
      throw new Error(`Vyhledávání selhalo: ${response.statusText}`);
    }

    const data = (await response.json()) as { results: KnowledgeSearchResultItem[] };
    return data.results;
  }

  async indexDocument(docId: string, content: string, title: string, source = "agent"): Promise<void> {
    this.setExplanation({
      ...this.explanation,
      currentActivity: `Indexuji dokument: "${title}"`,
      goal: "Zaindexovat dokument do vektorové databáze.",
      reason: "Uživatel požádal o indexaci dokumentu.",
      findings: "Probíhá chunkování a tvorba embeddingů...",
      evidence: ["chunking engine", "embedding provider"],
      toolsUsed: ["embeddings", "vector-store", "chunking"],
      nextStep: "Potvrdit úspěšnou indexaci.",
      estimatedCompletion: "Několik vteřin až minut",
      risks: "Velké dokumenty mohou trvat déle.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí dokumentu",
      confidence: "90 %",
      alternativeApproach: "Žádný.",
    });

    const response = await fetch("/api/knowledge/index/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, content, title, source, tags: [] }),
    });

    if (!response.ok) {
      throw new Error(`Indexace selhala: ${response.statusText}`);
    }
  }

  async reindexAll(): Promise<void> {
    this.setExplanation({
      ...this.explanation,
      currentActivity: "Provádím reindexaci celé znalostní báze.",
      goal: "Přestavět všechny indexy a embeddingy.",
      reason: "Uživatel požádal o reindexaci.",
      findings: "Probíhá indexace všech dokumentů...",
      evidence: ["chunking engine", "embedding provider", "obsidian vault"],
      toolsUsed: ["embeddings", "vector-store", "chunking", "obsidian"],
      nextStep: "Potvrdit dokončení reindexace.",
      estimatedCompletion: "Několik minut",
      risks: "Může trvat déle u velkých vaultů.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí příkazu",
      confidence: "95 %",
      alternativeApproach: "Žádný.",
    });

    const response = await fetch("/api/knowledge/reindex", { method: "POST" });

    if (!response.ok) {
      throw new Error(`Reindexace selhala: ${response.statusText}`);
    }
  }

  async getStats(): Promise<Record<string, unknown>> {
    const response = await fetch("/api/knowledge/stats");

    if (!response.ok) {
      throw new Error(`Statistiky selhaly: ${response.statusText}`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  getTaskProgress(): number {
    return super.getTaskProgress();
  }
}
