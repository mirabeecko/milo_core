export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export interface VectorSearchResult<T> {
  item: T;
  score: number;
}

export interface VectorStore<T> {
  add(items: T[], embeddings: number[][]): Promise<void>;
  search(queryEmbedding: number[], limit?: number, filter?: Partial<T>): Promise<VectorSearchResult<T>[]>;
}

export { OpenAiEmbeddings } from "./openai-embeddings.js";
export { OllamaEmbeddings } from "./ollama-embeddings.js";
export { InMemoryVectorStore } from "./vector-store.js";
export type { InMemoryVectorStoreOptions } from "./vector-store.js";
