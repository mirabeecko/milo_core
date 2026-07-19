import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// ─── DB Setup ─────────────────────────────────────────────────

const DB_PATH = "/tmp/phone-tracker.db";
const PYTHON = "python3";

/** Run a Python snippet that uses sqlite3 and return parsed JSON result. */
function pySql(script: string, dbPath: string = DB_PATH): any {
  const wrapped = `
import json, sqlite3, sys
try:
    db = sqlite3.connect("${dbPath}")
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
${script.split("\n").map((l) => "    " + l).join("\n")}
    db.close()
except Exception as e:
    print(json.dumps({"__error__": str(e)}), file=sys.stderr)
    sys.exit(1)
`;
  const result = spawnSync(PYTHON, ["-c", wrapped], {
    encoding: "utf-8",
    timeout: 5000,
  });
  if (result.status !== 0 || result.stderr) {
    const errMsg = result.stderr?.trim() || result.error?.message || "Unknown Python error";
    throw new Error(`Python sqlite3 error: ${errMsg}`);
  }
  try {
    return JSON.parse(result.stdout.trim() || "null");
  } catch {
    // If stdout is not JSON, return as-is (row count etc.)
    return result.stdout.trim();
  }
}

function ensureDb(): void {
  pySql(`
cursor.execute("PRAGMA journal_mode=WAL")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL,
        lng REAL,
        accuracy TEXT,
        files TEXT,
        timestamp TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )
""")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp)")
db.commit()
`);
}

// ─── Types ────────────────────────────────────────────────────

interface PhoneDataInput {
  lat: number;
  lng: number;
  accuracy?: number;
  files?: string[];
  timestamp: string;
}

interface QueryResult {
  query: { from: string; to: string };
  count: number;
  points: Array<{
    id: number;
    lat: number;
    lng: number;
    accuracy: string | null;
    files: string[];
    timestamp: string;
  }>;
  summary: string;
  agent: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function generateSummary(
  points: Array<{ timestamp: string; files: string[]; lat: number; lng: number }>,
  from: string | undefined,
  to: string | undefined,
): string {
  const lines: string[] = [];
  if (points.length === 0) {
    return "V daném období nejsou žádná data.";
  }

  const fromLabel = from ?? "začátek";
  const toLabel = to ?? "současnost";
  lines.push(
    `Nalezeno ${points.length} záznamů v období ${fromLabel} – ${toLabel}.`,
  );

  const allFiles = points.flatMap((p) => p.files);
  const uniqueFiles = [...new Set(allFiles)];
  if (uniqueFiles.length > 0) {
    lines.push(
      `Soubory: ${uniqueFiles.slice(0, 10).join(", ")}${uniqueFiles.length > 10 ? " a další" : ""}.`,
    );
  }

  if (points.length >= 2) {
    const first = points[points.length - 1].timestamp;
    const last = points[0].timestamp;
    lines.push(`Časový rozsah: ${first} až ${last}.`);
  } else if (points.length === 1) {
    lines.push(`Jediný záznam: ${points[0].timestamp}.`);
  }

  if (points.length >= 2) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    lines.push(
      `Průměrná poloha: ${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}.`,
    );
  }

  return lines.join(" ");
}

// ─── Routes ───────────────────────────────────────────────────

export async function phoneTrackerRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  // Initialize DB on startup
  ensureDb();

  // POST /phone-tracker/data — příjem dat z telefonu
  app.post<{ Body: PhoneDataInput }>(
    "/data",
    async (request, reply) => {
      const { lat, lng, accuracy, files, timestamp } = request.body;

      if (lat == null || lng == null || !timestamp) {
        return reply.status(400).send({
          error: "Missing required fields: lat, lng, timestamp",
        });
      }

      const filesJson = JSON.stringify(files ?? []);

      try {
        const result = pySql(`
cursor.execute(
    "INSERT INTO locations (lat, lng, accuracy, files, timestamp) VALUES (?, ?, ?, ?, ?)",
    (${lat}, ${lng}, ${accuracy != null ? `"${accuracy}"` : "None"}, ${JSON.stringify(filesJson)}, ${JSON.stringify(timestamp)})
)
db.commit()
print(json.dumps({"ok": True, "id": cursor.lastrowid, "message": "Phone data stored", "agent": "phone-tracker"}))
`);

        app.log.info(
          `[phone-tracker] Data stored: lat=${lat} lng=${lng} ts=${timestamp} files=${files?.length ?? 0}`,
        );

        return reply.status(201).send(result);
      } catch (err) {
        app.log.error({ err }, "Failed to store phone data");
        return reply.status(500).send({ error: "Failed to store data" });
      }
    },
  );

  // GET /phone-tracker/query — dotaz "co jsem dělal?"
  app.get<{
    Querystring: { from?: string; to?: string; limit?: string };
  }>(
    "/query",
    async (request, reply) => {
      const { from, to, limit } = request.query;
      const maxResults = limit ? parseInt(limit, 10) : 1000;

      try {
        let whereClause = "";
        const params: string[] = [];
        if (from) {
          whereClause += ` AND timestamp >= ${JSON.stringify(from)}`;
        }
        if (to) {
          whereClause += ` AND timestamp <= ${JSON.stringify(to)}`;
        }

        const rows = pySql(`
cursor.execute(
    "SELECT * FROM locations WHERE 1=1${whereClause} ORDER BY timestamp DESC LIMIT ${maxResults}"
)
rows = [dict(row) for row in cursor.fetchall()]
print(json.dumps(rows, default=str))
`);

        const points = (rows as any[]).map((row: any) => ({
          id: row.id,
          lat: row.lat,
          lng: row.lng,
          accuracy: row.accuracy,
          files: (() => {
            try {
              return JSON.parse(row.files || "[]") as string[];
            } catch {
              return [];
            }
          })(),
          timestamp: row.timestamp,
        }));

        const result: QueryResult = {
          query: { from: from ?? "*", to: to ?? "*" },
          count: points.length,
          points,
          summary: generateSummary(points, from, to),
          agent: "phone-tracker",
        };

        return reply.send(result);
      } catch (err) {
        app.log.error({ err }, "Failed to query phone data");
        return reply.status(500).send({ error: "Failed to query data" });
      }
    },
  );

  // GET /phone-tracker/stats — quick stats
  app.get("/stats", async (_request, reply) => {
    try {
      const stats = pySql(`
cursor.execute("SELECT COUNT(*) as totalRecords FROM locations")
total = cursor.fetchone()["totalRecords"]
firstTimestamp = None
lastTimestamp = None
if total > 0:
    cursor.execute("SELECT timestamp FROM locations ORDER BY timestamp ASC LIMIT 1")
    firstTimestamp = cursor.fetchone()["timestamp"]
    cursor.execute("SELECT timestamp FROM locations ORDER BY timestamp DESC LIMIT 1")
    lastTimestamp = cursor.fetchone()["timestamp"]
print(json.dumps({"totalRecords": total, "firstRecord": firstTimestamp, "lastRecord": lastTimestamp, "agent": "phone-tracker"}, default=str))
`);
      return reply.send(stats);
    } catch (err) {
      app.log.error({ err }, "Failed to get stats");
      return reply.status(500).send({ error: "Failed to get stats" });
    }
  });

  // ─── SPY_G WATCHLIST ──────────────────────────────────────

  const WATCHLIST_PATH = "/tmp/spyg-watchlist.json";

  app.get("/spyg/watchlist", async (_request, reply) => {
    try {
      const { readFileSync } = await import("node:fs");
      if (!existsSync(WATCHLIST_PATH)) {
        return reply.send({ items: [] });
      }
      const data = JSON.parse(readFileSync(WATCHLIST_PATH, "utf-8"));
      return reply.send(data);
    } catch (err) {
      return reply.status(500).send({ error: "Failed to read watchlist" });
    }
  });

  app.post<{ Body: { text: string; tags?: string[]; description?: string } }>(
    "/spyg/watchlist",
    async (request, reply) => {
      try {
        const { writeFileSync, readFileSync } = await import("node:fs");
        const { randomUUID } = await import("node:crypto");
        let data: any = { items: [] };
        if (existsSync(WATCHLIST_PATH)) {
          data = JSON.parse(readFileSync(WATCHLIST_PATH, "utf-8"));
        }
        const item = {
          id: randomUUID().slice(0, 8),
          text: request.body.text,
          source: "MiLO Web",
          importance: 7,
          relevance: 8,
          gamechanger: false,
          status: "pending",
          firstSeen: new Date().toISOString(),
          lastReminded: null,
          tags: request.body.tags || [],
          description: request.body.description || "",
        };
        data.items.push(item);
        writeFileSync(WATCHLIST_PATH, JSON.stringify(data, null, 2));
        return reply.send({ ok: true, item });
      } catch (err) {
        return reply.status(500).send({ error: "Failed to save" });
      }
    },
  );

  app.put<{ Params: { id: string }; Body: any }>(
    "/spyg/watchlist/:id",
    async (request, reply) => {
      try {
        const { writeFileSync, readFileSync, existsSync } = await import("node:fs");
        if (!existsSync(WATCHLIST_PATH)) return reply.status(404).send({ error: "Watchlist not found" });
        const data = JSON.parse(readFileSync(WATCHLIST_PATH, "utf-8"));
        const idx = data.items.findIndex((i: any) => i.id === request.params.id);
        if (idx === -1) return reply.status(404).send({ error: "Item not found" });
        data.items[idx] = { ...data.items[idx], ...request.body, id: request.params.id };
        writeFileSync(WATCHLIST_PATH, JSON.stringify(data, null, 2));
        return reply.send({ ok: true, item: data.items[idx] });
      } catch (err) {
        return reply.status(500).send({ error: "Failed to update" });
      }
    },
  );

  // ─── PROJECTS (rozšířené watchlist položky) ──────────────

  interface ProjectInput {
    text: string;
    tags?: string[];
    description?: string;
    financialPotential?: string;
    phase?: string;
    preLaunchTasks?: string[];
    priority?: number;
  }

  const VALID_PHASES = ["nápad", "plánování", "vývoj", "spuštěno", "výdělečné"];

  app.get("/projects", async (_request, reply) => {
    try {
      const { readFileSync } = await import("node:fs");
      if (!existsSync(WATCHLIST_PATH)) {
        return reply.send({ items: [] });
      }
      const data = JSON.parse(readFileSync(WATCHLIST_PATH, "utf-8"));
      // Ensure all items have the project metadata (default if missing)
      data.items = (data.items || []).map((item: any) => ({
        ...item,
        financialPotential: item.financialPotential || "—",
        phase: VALID_PHASES.includes(item.phase) ? item.phase : "nápad",
        preLaunchTasks: item.preLaunchTasks || [],
        priority: typeof item.priority === "number" ? item.priority : 5,
      }));
      return reply.send(data);
    } catch (err) {
      return reply.status(500).send({ error: "Failed to read projects" });
    }
  });

  app.post<{ Body: ProjectInput }>(
    "/projects",
    async (request, reply) => {
      try {
        const { writeFileSync, readFileSync } = await import("node:fs");
        const { randomUUID } = await import("node:crypto");
        let data: any = { items: [] };
        if (existsSync(WATCHLIST_PATH)) {
          data = JSON.parse(readFileSync(WATCHLIST_PATH, "utf-8"));
        }
        const phase = VALID_PHASES.includes(request.body.phase || "") ? request.body.phase : "nápad";
        const item = {
          id: randomUUID().slice(0, 8),
          text: request.body.text,
          source: "MiLO Web",
          importance: request.body.priority || 7,
          relevance: 8,
          gamechanger: false,
          status: "pending",
          firstSeen: new Date().toISOString(),
          lastReminded: null,
          tags: request.body.tags || [],
          description: request.body.description || "",
          financialPotential: request.body.financialPotential || "—",
          phase,
          preLaunchTasks: request.body.preLaunchTasks || [],
          priority: typeof request.body.priority === "number" ? request.body.priority : 5,
        };
        data.items.push(item);
        writeFileSync(WATCHLIST_PATH, JSON.stringify(data, null, 2));
        return reply.send({ ok: true, item });
      } catch (err) {
        return reply.status(500).send({ error: "Failed to save project" });
      }
    },
  );

  // ─── KANBAN (Hermes) ───────────────────────────────────
  app.get("/workspace/kanban", async (_request, reply) => {
    try {
      const { execSync } = await import("node:child_process");
      const home = process.env.HOME || "/Users/mb";
      const out = execSync(
        `sqlite3 -json ${home}/.hermes/kanban.db "SELECT id, title, status, assignee, priority FROM tasks ORDER BY status, priority DESC LIMIT 20"`,
        { timeout: 5000 }
      ).toString();
      return reply.send(JSON.parse(out || "[]"));
    } catch {
      return reply.send([]);
    }
  });

  app.post("/workspace/kanban/create", async (request, reply) => {
    try {
      const { execSync } = await import("node:child_process");
      const home = process.env.HOME || "/Users/mb";
      const title = (request.body as any).title?.replace(/'/g, "''") || "Task";
      const priority = (request.body as any).priority || 7;
      execSync(`hermes kanban create --title '${title}' --priority ${priority}`, { timeout: 5000, env: { ...process.env, HOME: home } });
      return reply.send({ ok: true });
    } catch (e: any) {
      return reply.status(500).send({ error: e.stderr?.toString() || "Failed" });
    }
  });

  app.post("/workspace/kanban/swarm", async (request, reply) => {
    try {
      const { execSync } = await import("node:child_process");
      const home = process.env.HOME || "/Users/mb";
      const goal = (request.body as any).goal?.replace(/'/g, "''") || "Analyze and report";
      const workers = (request.body as any).workers || 3;
      const cmd = `hermes kanban swarm --worker "default:Dělník 1" --worker "default:Dělník 2" --verifier default --synthesizer default --priority 8 "${goal}"`;
      const out = execSync(cmd, { timeout: 10000, env: { ...process.env, HOME: home } }).toString();
      return reply.send({ ok: true, output: out.split("\n").filter(Boolean) });
    } catch (e: any) {
      return reply.status(500).send({ error: e.stderr?.toString() || "Failed" });
    }
  });

  // ─── DELEGATION HISTORY ───────────────────────────────────

  app.get("/delegations", async (_request, reply) => {
    try {
      const { readFileSync, existsSync } = await import("node:fs");
      const path = "/tmp/delegation-history.json";
      if (!existsSync(path)) return reply.send([]);
      return reply.send(JSON.parse(readFileSync(path, "utf-8")));
    } catch {
      return reply.send([]);
    }
  });
}
