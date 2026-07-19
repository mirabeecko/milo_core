import { EmbeddingProvider } from "./index.js";

const MAX_TOKENS_PER_TEXT = 2048;

function truncateToTokens(text: string, maxTokens: number): string {
  const words = text.split(/\s+/);
  const estimatedTokens = words.length * 1.3;
  if (estimatedTokens <= maxTokens) return text;
  const targetWords = Math.floor(maxTokens / 1.3);
  return words.slice(0, targetWords).join(" ");
}

export class OpenAiEmbeddings implements EmbeddingProvider {
  readonly name = "openai-embeddings";

  constructor(
    private apiKey: string,
    private model = "text-embedding-3-small",
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const truncated = texts.map((t) => truncateToTokens(t, MAX_TOKENS_PER_TEXT));

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: truncated,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI embeddings API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as {
      data: { embedding: number[]; index: number }[];
    };

    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }

  async embedQuery(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }
}
