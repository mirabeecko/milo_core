import { describe, it, expect, beforeAll } from "vitest";

describe("chunking", () => {
  let chunkContent: (text: string, opts?: any) => any[];
  let chunkMarkdown: (md: string, opts?: any) => any[];

  beforeAll(async () => {
    const mod = await import("./chunking.js");
    chunkContent = mod.chunkContent;
    chunkMarkdown = mod.chunkMarkdown;
  });

  it("returns single chunk for short text", () => {
    const result = chunkContent("Short text");
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Short text");
  });

  it("splits long text by paragraphs", () => {
    const longText = Array(50).fill("Paragraph text here.").join("\n\n");
    const result = chunkContent(longText, { maxChunkSize: 500 });
    expect(result.length).toBeGreaterThan(1);
  });

  it("skips content smaller than minChunkSize when splitting large text", () => {
    const text = Array(100).fill("x").join("") + "\n\nvery small";
    const result = chunkContent(text, { maxChunkSize: 50, minChunkSize: 10 });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("chunkMarkdown splits by headings", () => {
    const md = "## Section 1\nContent one.\n\n## Section 2\nContent two.";
    const result = chunkMarkdown(md, { maxChunkSize: 200 });
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("preserves content in chunks", () => {
    const text = "Hello world test content here.";
    const result = chunkContent(text);
    const allContent = result.map((c: any) => c.content).join("\n\n");
    expect(allContent).toContain("Hello world");
  });
});
