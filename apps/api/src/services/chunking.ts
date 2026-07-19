export interface TextChunk {
  text: string;
  index: number;
  heading?: string;
  startOffset: number;
  endOffset: number;
}

const MAX_CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 50;

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function extractHeading(line: string): string | undefined {
  const match = line.match(/^(#{1,6})\s+(.+)/);
  if (match) return match[2].trim();
  return undefined;
}

function splitIntoSentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const result: string[] = [];

  for (const sentence of sentences) {
    if (sentence.trim().length > 0) {
      result.push(sentence.trim());
    }
  }

  return result;
}

export function chunkText(content: string): TextChunk[] {
  const lines = content.split("\n");
  const chunks: TextChunk[] = [];
  let currentHeading: string | undefined;
  let currentChunk = "";
  let globalOffset = 0;
  let chunkIndex = 0;

  const paragraphs: { text: string; heading?: string }[] = [];
  let paragraphBuffer = "";

  for (const line of lines) {
    const headingMatch = extractHeading(line);
    if (headingMatch) {
      if (paragraphBuffer.trim()) {
        paragraphs.push({ text: paragraphBuffer.trim(), heading: currentHeading });
        paragraphBuffer = "";
      }
      currentHeading = headingMatch;
      continue;
    }

    if (line.trim() === "") {
      if (paragraphBuffer.trim()) {
        paragraphs.push({ text: paragraphBuffer.trim(), heading: currentHeading });
        paragraphBuffer = "";
      }
    } else {
      if (paragraphBuffer) paragraphBuffer += " ";
      paragraphBuffer += line.trim();
    }
  }

  if (paragraphBuffer.trim()) {
    paragraphs.push({ text: paragraphBuffer.trim(), heading: currentHeading });
  }

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para.text);

    if (paraTokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        text: para.text,
        index: chunkIndex++,
        heading: para.heading,
        startOffset: globalOffset,
        endOffset: globalOffset + para.text.length,
      });
      globalOffset += para.text.length;
    } else {
      const sentences = splitIntoSentences(para.text);
      let subChunk = "";
      let overlap = "";

      for (const sentence of sentences) {
        const combined = subChunk ? `${subChunk} ${sentence}` : sentence;

        if (estimateTokens(combined) > MAX_CHUNK_TOKENS && subChunk) {
          chunks.push({
            text: subChunk,
            index: chunkIndex++,
            heading: para.heading,
            startOffset: globalOffset,
            endOffset: globalOffset + subChunk.length,
          });
          globalOffset += subChunk.length;

          if (overlap) {
            subChunk = `${overlap} ${sentence}`;
          } else {
            subChunk = sentence;
          }
          overlap = createOverlap(subChunk);
        } else {
          subChunk = combined;
          overlap = createOverlap(subChunk);
        }
      }

      if (subChunk.trim()) {
        chunks.push({
          text: subChunk,
          index: chunkIndex++,
          heading: para.heading,
          startOffset: globalOffset,
          endOffset: globalOffset + subChunk.length,
        });
        globalOffset += subChunk.length;
      }
    }
  }

  return chunks;
}

function createOverlap(text: string): string {
  const words = text.split(/\s+/);
  const overlapWords = Math.floor(OVERLAP_TOKENS / 1.3);
  if (words.length <= overlapWords) return text;
  return words.slice(words.length - overlapWords).join(" ");
}

// ---------------------------------------------------------------------------
// Enhanced chunking API (Milestone 3)
// ---------------------------------------------------------------------------

export interface Chunk {
  index: number;
  content: string;
  tokenCount: number;
  startChar: number;
  endChar: number;
}

export interface ChunkingOptions {
  maxChunkSize?: number;
  chunkOverlap?: number;
  minChunkSize?: number;
}

export function chunkContent(
  text: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const {
    maxChunkSize = 1500,
    chunkOverlap = 200,
    minChunkSize = 100,
  } = options;

  if (!text || text.length <= maxChunkSize) {
    return [{
      index: 0,
      content: text,
      tokenCount: estimateTokensChar(text),
      startChar: 0,
      endChar: text.length,
    }];
  }

  const paragraphs = text.split(/\n\n+/);
  const chunks: Chunk[] = [];
  let currentChunk = "";
  let startChar = 0;
  let charPos = 0;

  for (const para of paragraphs) {
    const paraLen = para.length + 2;

    if ((currentChunk + para).length > maxChunkSize && currentChunk.length > minChunkSize) {
      chunks.push({
        index: chunks.length,
        content: currentChunk.trim(),
        tokenCount: estimateTokensChar(currentChunk),
        startChar,
        endChar: charPos - 2,
      });

      const overlap = currentChunk.slice(-chunkOverlap);
      currentChunk = overlap + "\n\n" + para;
      startChar = charPos - overlap.length;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }

    charPos += paraLen;
  }

  if (currentChunk.trim().length >= minChunkSize) {
    chunks.push({
      index: chunks.length,
      content: currentChunk.trim(),
      tokenCount: estimateTokensChar(currentChunk),
      startChar,
      endChar: text.length,
    });
  }

  return chunks;
}

/** Rough token estimation: ~4 chars per token for English, ~3 for Czech */
function estimateTokensChar(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkMarkdown(
  markdown: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const { maxChunkSize = 1500, chunkOverlap = 200, minChunkSize = 100 } = options;

  const sections = markdown.split(/\n(?=## )/);
  const allChunks: Chunk[] = [];

  for (const section of sections) {
    if (section.length <= maxChunkSize) {
      if (section.trim().length >= minChunkSize) {
        allChunks.push({
          index: allChunks.length,
          content: section.trim(),
          tokenCount: estimateTokensChar(section),
          startChar: markdown.indexOf(section),
          endChar: markdown.indexOf(section) + section.length,
        });
      }
    } else {
      const subChunks = chunkContent(section, options);
      for (const chunk of subChunks) {
        allChunks.push({
          ...chunk,
          index: allChunks.length,
          startChar: markdown.indexOf(section) + chunk.startChar,
          endChar: markdown.indexOf(section) + chunk.endChar,
        });
      }
    }
  }

  return allChunks;
}

export function chunkByType(
  content: string,
  type: "email" | "document" | "note" | "drive_file" | "calendar_event",
  options?: ChunkingOptions
): Chunk[] {
  switch (type) {
    case "note":
    case "document":
      return chunkMarkdown(content, options);
    case "email":
      return chunkContent(content, { maxChunkSize: 800, ...options });
    case "drive_file":
      return chunkContent(content, { maxChunkSize: 2000, ...options });
    case "calendar_event":
      return chunkContent(content, { maxChunkSize: 2000, ...options });
    default:
      return chunkContent(content, options);
  }
}
