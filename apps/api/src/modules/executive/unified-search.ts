/**
 * Daily Capability: Rozšířené vyhledávání — PDF, Markdown, Git repozitáře.
 * Vlastník může prohledávat celou znalostní bázi MiLO z jednoho endpointu.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../../../..");
const DEV_ROOT = resolve(REPO_ROOT, "..");
const DATA_DIR = resolve(__dirname, "../../../data");
const INDEX_FILE = resolve(DATA_DIR, "unified-index.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export interface UnifiedDoc {
  path: string;
  title: string;
  type: "markdown" | "pdf" | "code" | "image";
  size: number;
  source: string;  // "MiLO_Core", "MiLO_ISDS_MCP", "MiLO_Agent", etc.
  category: string;
  preview: string;
  date?: string;
}

// ─── Build ───────────────────────────────────────────────────────────

export function buildUnifiedIndex(): { entries: UnifiedDoc[]; count: number; sources: string[] } {
  const entries: UnifiedDoc[] = [];
  const sources = new Set<string>();

  // 1. Markdown files from MiLO_Core
  try {
    const mdFiles = execSync(
      `find "${REPO_ROOT}" -name "*.md" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/better-agents/*" -not -path "*/dist/*" -not -path "*/.aider*"`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim().split("\n").filter(Boolean);

    for (const f of mdFiles.slice(0, 80)) {
      try {
        const raw = readFileSync(f, "utf-8");
        const rel = relative(REPO_ROOT, f);
        const title = (raw.match(/^# (.+)$/m) || [])[1] || rel;
        entries.push({
          path: rel, title, type: "markdown", size: raw.length,
          source: "MiLO_Core", category: categorize(rel),
          preview: raw.replace(/^#.*$/gm, "").replace(/```[\s\S]*?```/g, "").replace(/\n{3,}/g, "\n").trim().slice(0, 200),
        });
        sources.add("MiLO_Core");
      } catch { /* skip unreadable */ }
    }
  } catch { /* skip */ }

  // 2. PDF metadata from ISDS
  try {
    const pdfFiles = execSync(
      `find "${DEV_ROOT}/MiLO_ISDS_MCP/data" -name "*.pdf" -not -path "*/search_index/*" 2>/dev/null | head -50`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim().split("\n").filter(Boolean);

    for (const f of pdfFiles) {
      const rel = relative(DEV_ROOT, f);
      const name = rel.split("/").pop() || rel;
      entries.push({
        path: rel, title: name.replace(/\.pdf$/i, "").replace(/_/g, " "),
        type: "pdf", size: 0,
        source: "MiLO_ISDS_MCP", category: "legal",
        preview: `PDF dokument v datové schránce: ${rel.split("/")[4] || "unknown"}`,
        date: rel.split("/")[3] || undefined,
      });
      sources.add("MiLO_ISDS_MCP");
    }
  } catch { /* skip */ }

  // 3. Code files (TypeScript)
  try {
    const tsFiles = execSync(
      `find "${REPO_ROOT}/packages/agents/src" "${REPO_ROOT}/apps/api/src/modules/executive" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | head -30`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim().split("\n").filter(Boolean);

    for (const f of tsFiles) {
      const rel = relative(REPO_ROOT, f);
      const raw = readFileSync(f, "utf-8");
      entries.push({
        path: rel, title: rel, type: "code", size: raw.length,
        source: "MiLO_Core", category: "code",
        preview: raw.split("\n").filter((l) => l.trim() && !l.startsWith("import") && !l.startsWith("//") && !l.startsWith("/*")).slice(0, 3).join("\n").slice(0, 200),
      });
      sources.add("MiLO_Core");
    }
  } catch { /* skip */ }

  writeFileSync(INDEX_FILE, JSON.stringify(entries, null, 2));
  return { entries, count: entries.length, sources: [...sources] };
}

// ─── Search ──────────────────────────────────────────────────────────

export function unifiedSearch(query: string, limit = 15): UnifiedDoc[] {
  if (!existsSync(INDEX_FILE)) return [];
  const entries: UnifiedDoc[] = JSON.parse(readFileSync(INDEX_FILE, "utf-8"));
  const terms = query.toLowerCase().split(/\s+/);
  return entries
    .filter((e) => {
      const haystack = `${e.title} ${e.preview} ${e.source} ${e.category}`.toLowerCase();
      return terms.some((t) => haystack.includes(t));
    })
    .slice(0, limit);
}

// ─── Categories ──────────────────────────────────────────────────────

function categorize(path: string): string {
  if (path.includes("CONSTITUTION")) return "constitution";
  if (path.includes("CONCEPTUAL_MODEL")) return "architecture";
  if (path.includes("ARCHITECTURE")) return "architecture";
  if (path.includes("docs/adr/")) return "adr";
  if (path.includes("docs/board/")) return "board";
  if (path.includes("AGENTS")) return "agent";
  if (path.includes("README")) return "meta";
  return "other";
}
