import { z } from "zod";
import type { Tool } from "../../types/index.js";

const webSearchSchema = z.object({
  query: z.string(),
  maxResults: z.number().optional(),
});

export interface WebSearchResult {
  query: string;
  results: {
    title: string;
    url: string;
    snippet: string;
  }[];
}

export class WebSearchTool implements Tool<z.infer<typeof webSearchSchema>, WebSearchResult> {
  readonly id = "web-search:search";
  readonly description = "Search the web for information";
  readonly parameters = webSearchSchema;

  async execute(input: z.infer<typeof webSearchSchema>): Promise<WebSearchResult> {
    const maxResults = input.maxResults ?? 5;
    return {
      query: input.query,
      results: [
        {
          title: `Mock result for "${input.query}"`,
          url: "https://example.com/mock",
          snippet: "This is a mock web search result. Replace with real provider (Serper, Tavily, etc.).",
        },
      ].slice(0, maxResults),
    };
  }
}

export function registerWebSearchTools(registry: { register(tool: Tool): void }): void {
  registry.register(new WebSearchTool());
}
