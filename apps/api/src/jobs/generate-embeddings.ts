import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config/index.js";
import type { JobData } from "../infrastructure/queue.js";
import { JobName } from "../infrastructure/queue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const EMBEDDINGS_FILE = path.join(DATA_DIR, "document-embeddings.json");

interface StoredEmbedding {
  documentId: string;
  vector: number[];
  model: string;
  dimensions: number;
  generatedAt: string;
}

function isConfigured(): boolean {
  return Boolean(config.OPENAI_API_KEY);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const baseURL = config.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const response = await fetch(`${baseURL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embeddings API error: ${response.status} ${errorText}`);
  }

  const json = (await response.json()) as { data: Array<{ embedding: number[] }> };
  return json.data[0]?.embedding ?? [];
}

export async function generateEmbeddingsJob(data: JobData[JobName.GENERATE_EMBEDDINGS]): Promise<{
  documentId: string;
  dimensions: number;
}> {
  const { documentId } = data;

  console.log(`[job:generate:embeddings] Starting embeddings generation for document ${documentId}`);

  if (!isConfigured()) {
    console.log("[job:generate:embeddings] OpenAI API key not configured, skipping");
    throw new Error("OpenAI API key not configured");
  }

  const docIndexPath = path.join(DATA_DIR, "document-index.json");
  let docContent = "";
  try {
    const raw = await fs.readFile(docIndexPath, "utf-8");
    const index = JSON.parse(raw) as Record<string, unknown>;
    docContent = typeof index.title === "string" ? index.title : documentId;
  } catch {
    docContent = documentId;
  }

  const vector = await generateEmbedding(docContent);

  const stored: StoredEmbedding = {
    documentId,
    vector,
    model: "text-embedding-3-small",
    dimensions: vector.length,
    generatedAt: new Date().toISOString(),
  };

  await fs.mkdir(DATA_DIR, { recursive: true });

  let existing: StoredEmbedding[] = [];
  try {
    const raw = await fs.readFile(EMBEDDINGS_FILE, "utf-8");
    existing = JSON.parse(raw) as StoredEmbedding[];
  } catch {
    // file doesn't exist yet
  }

  const idx = existing.findIndex((e) => e.documentId === documentId);
  if (idx >= 0) {
    existing[idx] = stored;
  } else {
    existing.push(stored);
  }

  await fs.writeFile(EMBEDDINGS_FILE, JSON.stringify(existing, null, 2), "utf-8");

  console.log(`[job:generate:embeddings] Generated ${vector.length}-dim embedding for doc ${documentId}`);
  return { documentId, dimensions: vector.length };
}

export async function getEmbeddings(
  documentId: string,
): Promise<StoredEmbedding | undefined> {
  try {
    const raw = await fs.readFile(EMBEDDINGS_FILE, "utf-8");
    const embeddings = JSON.parse(raw) as StoredEmbedding[];
    return embeddings.find((e) => e.documentId === documentId);
  } catch {
    return undefined;
  }
}
