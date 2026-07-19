/**
 * Obsidian Vault Indexer — prochází všechny .md soubory, extrahuje metadata a
 * buduje prohledávatelný index. Připraveno pro budoucí vektorovou indexaci.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, extname } from "path";

const VAULT_PATH = "/Users/mb/Obsidian";
const INDEX_PATH = "/Users/mb/dev/MiLO_Core/apps/api/data/obsidian-index.json";
const MAX_FILES = 500;

interface IndexedDoc {
  path: string;
  title: string;
  tags: string[];
  links: string[];
  excerpt: string;
  size: number;
  modifiedAt: string;
  wordCount: number;
}

function extractTitle(content: string, filename: string): string {
  const h1 = content.match(/^#\s+(.+)/m);
  return h1?.[1] || filename.replace(".md", "");
}

function extractTags(content: string): string[] {
  const inline = content.match(/#[\w-]+/g) || [];
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  const fmTags: string[] = [];
  if (frontmatter) {
    const tagLine = frontmatter[1].match(/^tags:\s*\[(.+)\]$/m);
    if (tagLine) {
      const tags = tagLine[1].split(",").map(t => t.trim().replace(/"/g, ""));
      fmTags.push(...tags);
    }
  }
  return [...new Set([...inline, ...fmTags])].slice(0, 20);
}

function extractLinks(content: string): string[] {
  const wikilinks = content.match(/\[\[([^\]]+)\]\]/g) || [];
  return wikilinks.map(l => l.replace(/[\[\]]/g, "")).slice(0, 30);
}

function buildIndex(): IndexedDoc[] {
  const docs: IndexedDoc[] = [];

  function walk(dir: string, depth = 0) {
    if (depth > 5 || docs.length >= MAX_FILES) return;
    let entries: string[] = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      const full = join(dir, entry);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) { walk(full, depth + 1); continue; }
      if (extname(entry) !== ".md") continue;

      try {
        const content = readFileSync(full, "utf-8");
        const title = extractTitle(content, entry);
        docs.push({
          path: full.replace(VAULT_PATH + "/", ""),
          title,
          tags: extractTags(content),
          links: extractLinks(content),
          excerpt: content.slice(0, 500).replace(/\n/g, " "),
          size: st.size,
          modifiedAt: st.mtime.toISOString(),
          wordCount: content.split(/\s+/).length,
        });
      } catch {
        // skip unreadable
      }
    }
  }

  walk(VAULT_PATH);
  return docs.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

// Spuštění
console.log(`Indexuji Obsidian vault: ${VAULT_PATH}...`);
const index = buildIndex();
writeFileSync(INDEX_PATH, JSON.stringify({ indexedAt: new Date().toISOString(), count: index.length, docs: index }, null, 2));
console.log(`Hotovo: ${index.length} dokumentů → ${INDEX_PATH}`);
