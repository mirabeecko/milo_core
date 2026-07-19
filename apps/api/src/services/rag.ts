/**
 * Lightweight RAG (Retrieval Augmented Generation) service.
 * Provides context-aware responses by searching the knowledge base.
 *
 * For production use:
 * - pgvector for semantic search (instead of ILIKE)
 * - Re-ranking with cross-encoder
 * - Citations with source attribution
 */

export interface RAGResult {
  chunk: string;
  sourceType: string;
  sourceId: string;
  score: number;
  title?: string;
  path?: string;
}

export interface RAGContext {
  results: RAGResult[];
  query: string;
  totalFound: number;
}

/**
 * Calculate a simple relevance score based on term frequency.
 * In production, replace with vector similarity or BM25.
 */
export function calculateRelevance(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();

  let score = 0;
  for (const term of queryTerms) {
    if (term.length < 2) continue;
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = textLower.match(regex);
    if (matches) {
      score += Math.min(matches.length, 5);
    }
  }

  return score;
}

/**
 * Format RAG context for injection into an LLM prompt.
 */
export function formatRAGContext(context: RAGContext): string {
  if (context.results.length === 0) {
    return "";
  }

  const lines = [
    "## Relevantní kontext z uživatelovy znalostní báze",
    "",
  ];

  for (const result of context.results.slice(0, 5)) {
    const source = result.title || result.path || `${result.sourceType}:${result.sourceId}`;
    lines.push(`### Zdroj: ${source}`);
    lines.push(result.chunk.slice(0, 500));
    lines.push("");
  }

  lines.push("---");
  lines.push("Použij výše uvedený kontext pro odpověď. Pokud kontext nestačí, řekni to.");

  return lines.join("\n");
}

/**
 * Extract source citations from RAG results.
 */
export function extractSources(results: RAGResult[]): Array<{
  title: string;
  type: string;
  id: string;
}> {
  return results.slice(0, 5).map((r) => ({
    title: r.title || `${r.sourceType}:${r.sourceId}`,
    type: r.sourceType,
    id: r.sourceId,
  }));
}
