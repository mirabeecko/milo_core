/**
 * M2: Document Search Index — jednoduchý fulltextový index dokumentů.
 * Ukládá do JSON, přežije restart.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../../../..");
const DATA_DIR = resolve(__dirname, "../../../data");
const INDEX_FILE = resolve(DATA_DIR, "document-index.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export interface DocEntry {
  path: string;
  title: string;
  size: number;
  category: string;  // constitution, architecture, board, adr, etc.
  keywords: string[];
  preview: string;   // prvních 200 znaků
}

function extractTitle(content: string, fallback: string): string {
  const h1 = content.match(/^# (.+)$/m);
  return h1 ? h1[1].trim() : fallback;
}

function extractPreview(content: string): string {
  // Přeskoč frontmatter/titulky, vezmi první smysluplný odstavec
  const lines = content.split("\n");
  let inContent = false;
  const preview: string[] = [];
  for (const line of lines) {
    if (line.startsWith("## ") || line.startsWith("### ")) inContent = true;
    if (inContent && line.trim() && !line.startsWith("#") && !line.startsWith("```") && !line.startsWith("|") && !line.startsWith(">")) {
      preview.push(line.trim());
      if (preview.join(" ").length > 200) break;
    }
  }
  return preview.join(" ").slice(0, 200);
}

function categorize(path: string): string {
  if (path.includes("CONSTITUTION")) return "constitution";
  if (path.includes("ORGANIZATION_CONSTITUTION")) return "constitution";
  if (path.includes("CONCEPTUAL_MODEL")) return "architecture";
  if (path.includes("ARCHITECTURE")) return "architecture";
  if (path.includes("docs/adr/")) return "adr";
  if (path.includes("docs/board/")) return "board";
  if (path.includes("docs/rfc/")) return "rfc";
  if (path.includes("docs/templates/")) return "template";
  if (path.includes("docs/reviews/")) return "review";
  if (path.includes("AGENTS.md") || path.includes("AGENT_")) return "agent";
  if (path.includes("README")) return "meta";
  return "other";
}

export function buildIndex(): { entries: DocEntry[]; count: number } {
  const files = execSync(
    `find "${REPO_ROOT}" -name "*.md" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/better-agents/*" -not -path "*/dist/*" -not -path "*/.aider*"`,
    { encoding: "utf-8" },
  ).trim().split("\n").filter(Boolean).sort();

  const entries: DocEntry[] = [];

  for (const file of files.slice(0, 100)) { // max 100
    const rel = relative(REPO_ROOT, file);
    const raw = readFileSync(file, "utf-8");
    const title = extractTitle(raw, rel);
    entries.push({
      path: rel,
      title,
      size: raw.length,
      category: categorize(rel),
      keywords: title.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
      preview: extractPreview(raw),
    });
  }

  writeFileSync(INDEX_FILE, JSON.stringify(entries, null, 2));
  return { entries, count: entries.length };
}

export function searchIndex(query: string): DocEntry[] {
  if (!existsSync(INDEX_FILE)) return [];
  const entries: DocEntry[] = JSON.parse(readFileSync(INDEX_FILE, "utf-8"));
  const terms = query.toLowerCase().split(/\s+/);
  return entries
    .filter((e) => terms.some((t) => e.title.toLowerCase().includes(t) || e.keywords.some((k) => k.includes(t))))
    .slice(0, 10);
}

export function getIndex(): DocEntry[] {
  if (!existsSync(INDEX_FILE)) return [];
  return JSON.parse(readFileSync(INDEX_FILE, "utf-8"));
}
