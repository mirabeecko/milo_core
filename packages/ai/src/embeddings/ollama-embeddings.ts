import { EmbeddingProvider } from "./index.js";

export class OllamaEmbeddings implements EmbeddingProvider {
  readonly name = "ollama-embeddings";

  constructor(
    private baseUrl = "http://localhost:11434",
    private model = "nomic-embed-text",
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    for (const text of texts) {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: text }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ollama embeddings API error ${response.status}: ${body}`);
      }

      const data = (await response.json()) as { embedding: number[] };
      results.push(data.embedding);
    }

    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }
}
