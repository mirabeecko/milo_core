/**
 * Universal Search — prohledávání napříč všemi zdroji MiLO.
 *
 * Zdroje:
 *   1. Gmail (přes google_api.py bridge)
 *   2. Kalendář (přes google_api.py bridge)
 *   3. Obsidian vault (lokální soubory .md)
 *   4. MiLO dokumenty (přes knowledge routes)
 *
 * Endpoint: GET /executive/search?q=<query>
 */
import type { FastifyInstance } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { execFile } from "child_process";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const GAPI = "/Users/mb/.hermes/skills/productivity/google-workspace/scripts/google_api.py";
const OBSIDIAN_VAULT = "/Users/mb/dev/MiLO_Core/docs";
const GAPI_TIMEOUT = 8000;
const MAX_FILES = 50;

function runGapi(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("python3", [GAPI, ...args], {
      timeout: GAPI_TIMEOUT,
      maxBuffer: 512 * 1024,
    }, (err, stdout) => {
      if (err && !stdout) reject(new Error(err.message));
      else resolve(stdout || "");
    });
  });
}

interface SearchResultItem {
  source: "gmail" | "calendar" | "obsidian" | "document";
  id: string;
  title: string;
  snippet: string;
  date?: string;
  url?: string;
}

function parseJsonOutput(stdout: string): any[] {
  const start = stdout.indexOf("[");
  if (start < 0) return [];
  try { return JSON.parse(stdout.slice(start)); } catch { return []; }
}

export async function searchGmail(q: string): Promise<SearchResultItem[]> {
  try {
    const stdout = await runGapi(["gmail", "search", `"${q}"`, "--max", "10"]);
    const emails = parseJsonOutput(stdout);
    return emails.map((e: any) => ({
      source: "gmail" as const,
      id: e.id || "",
      title: e.subject || "(bez předmětu)",
      snippet: (e.snippet || "").slice(0, 200),
      date: e.date,
    }));
  } catch {
    return [];
  }
}

export async function searchCalendar(q: string): Promise<SearchResultItem[]> {
  try {
    const stdout = await runGapi(["calendar", "list", "--max", "10"]);
    const events = parseJsonOutput(stdout);
    const lower = q.toLowerCase();
    return events
      .filter((e: any) => (e.summary || "").toLowerCase().includes(lower) || (e.description || "").toLowerCase().includes(lower))
      .map((e: any) => ({
        source: "calendar" as const,
        id: e.id || "",
        title: e.summary || "Událost",
        snippet: `${e.start?.slice(0, 10) || "?"} — ${(e.description || "").slice(0, 150)}`,
        date: e.start,
      }));
  } catch {
    return [];
  }
}

function searchObsidian(q: string): SearchResultItem[] {
  try {
    const results: SearchResultItem[] = [];
    const walk = (dir: string, depth = 0) => {
      if (depth > 3 || results.length >= MAX_FILES) return;
      let entries: string[] = [];
      try { entries = readdirSync(dir); } catch { return; }
      for (const entry of entries) {
        if (entry.startsWith(".")) continue;
        const full = join(dir, entry);
        let st;
        try { st = statSync(full); } catch { continue; }
        if (st.isDirectory()) { walk(full, depth + 1); continue; }
        if (!entry.endsWith(".md")) continue;
        const name = entry.replace(".md", "");
        if (name.toLowerCase().includes(q.toLowerCase())) {
          results.push({
            source: "obsidian",
            id: full,
            title: name,
            snippet: full.replace(OBSIDIAN_VAULT + "/", ""),
            date: st.mtime.toISOString(),
          });
        }
      }
    };
    walk(OBSIDIAN_VAULT);
    return results;
  } catch {
    return [];
  }
}

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/executive/search",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const q = (request.query as any)?.q?.trim();
      if (!q || q.length < 2) {
        return reply.send({
          query: q || "",
          results: [],
          sources: { gmail: 0, calendar: 0, obsidian: 0, document: 0 },
          total: 0,
          hint: "Zadej alespoň 2 znaky",
        });
      }

      const [gmail, calendar, obsidian] = await Promise.all([
        searchGmail(q),
        searchCalendar(q),
        Promise.resolve(searchObsidian(q)),
      ]);

      const all = [...gmail, ...calendar, ...obsidian].sort(
        (a, b) => (b.date || "").localeCompare(a.date || ""),
      );

      return reply.send({
        query: q,
        results: all,
        sources: {
          gmail: gmail.length,
          calendar: calendar.length,
          obsidian: obsidian.length,
          document: 0,
        },
        total: all.length,
      });
    },
  );
}
