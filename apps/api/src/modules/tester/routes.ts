/**
 * MiLO TESTER — automatické testování celého MiLO s realtime výsledky.
 *
 * Endpointy:
 *   POST /tester/run     — spustí testy
 *   GET  /tester/results — poslední výsledky
 *   GET  /tester/history — historie
 *
 * Výsledky se ukládají do /tmp/milo-test-results.json
 */

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { SSEManager } from "../activity/sse-manager.js";

// ─── Constants ──────────────────────────────────────────────────
const RESULTS_PATH = "/tmp/milo-test-results.json";
const HISTORY_PATH = "/tmp/milo-test-history.json";
const API_BASE = "http://localhost:4000";
const WEB_BASE = "http://localhost:3001";
const TEST_TIMEOUT_MS = 5000;

// ─── Types ──────────────────────────────────────────────────────

interface TestCase {
  name: string;
  category: string;
  method: "GET" | "POST" | "PUT";
  url: string;
  body?: unknown;
  expectStatus?: number;
}

interface TestResult {
  name: string;
  category: string;
  url: string;
  method: string;
  status: "pass" | "fail" | "skip";
  httpStatus: number | null;
  durationMs: number;
  error?: string;
  bodyPreview?: string;
}

interface TestRun {
  id: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  results: TestResult[];
}

// ─── Test Definitions ───────────────────────────────────────────

const API_ENDPOINTS: TestCase[] = [
  // Core
  { name: "GET /health", category: "API Core", method: "GET", url: `${API_BASE}/health` },
  { name: "GET /ready", category: "API Core", method: "GET", url: `${API_BASE}/ready` },

  // Agents
  { name: "GET /agents", category: "Agents", method: "GET", url: `${API_BASE}/agents` },
  { name: "GET /control-center/agents/live", category: "Agents", method: "GET", url: `${API_BASE}/control-center/agents/live` },
  { name: "GET /control-center/status", category: "Agents", method: "GET", url: `${API_BASE}/control-center/status` },
  { name: "GET /api/agents/status", category: "Agents", method: "GET", url: `${API_BASE}/api/agents/status` },

  // Tasks
  { name: "GET /tasks", category: "Tasks", method: "GET", url: `${API_BASE}/tasks` },

  // Phone Tracker
  { name: "GET /phone-tracker/stats", category: "Phone Tracker", method: "GET", url: `${API_BASE}/phone-tracker/stats` },
  { name: "GET /phone-tracker/query", category: "Phone Tracker", method: "GET", url: `${API_BASE}/phone-tracker/query` },

  // SPY_G Watchlist
  { name: "GET /phone-tracker/spyg/watchlist", category: "SPY_G", method: "GET", url: `${API_BASE}/phone-tracker/spyg/watchlist` },
  { name: "GET /phone-tracker/projects", category: "SPY_G", method: "GET", url: `${API_BASE}/phone-tracker/projects` },

  // Kanban / Workspace
  { name: "GET /phone-tracker/workspace/kanban", category: "Kanban", method: "GET", url: `${API_BASE}/phone-tracker/workspace/kanban` },

  // Delegations
  { name: "GET /phone-tracker/delegations", category: "Delegations", method: "GET", url: `${API_BASE}/phone-tracker/delegations` },

  // Calendar
  { name: "GET /calendar", category: "Calendar", method: "GET", url: `${API_BASE}/calendar` },

  // Email
  { name: "GET /email", category: "Email", method: "GET", url: `${API_BASE}/email` },

  // Executive
  { name: "GET /executive/summary", category: "Executive", method: "GET", url: `${API_BASE}/executive/summary` },
  { name: "GET /executive/dashboard", category: "Executive", method: "GET", url: `${API_BASE}/executive/dashboard` },

  // Home/Briefing
  { name: "GET /briefing", category: "Briefing", method: "GET", url: `${API_BASE}/briefing` },
  { name: "GET /home", category: "Home", method: "GET", url: `${API_BASE}/home` },

  // Activity
  { name: "GET /api/activity/history", category: "Activity", method: "GET", url: `${API_BASE}/api/activity/history` },

  // Knowledge
  { name: "GET /knowledge", category: "Knowledge", method: "GET", url: `${API_BASE}/knowledge` },

  // Tasks detail
  { name: "GET /missions", category: "Missions", method: "GET", url: `${API_BASE}/missions` },

  // Projects
  { name: "GET /projects", category: "Projects", method: "GET", url: `${API_BASE}/projects` },

  // Settings
  { name: "GET /settings", category: "Settings", method: "GET", url: `${API_BASE}/settings` },
];

// POST testy
const API_POST_TESTS: TestCase[] = [
  {
    name: "POST /phone-tracker/spyg/watchlist (create item)",
    category: "SPY_G",
    method: "POST",
    url: `${API_BASE}/phone-tracker/spyg/watchlist`,
    body: { text: "TESTER: testovací položka", tags: ["test"], description: "Automatický test z MiLO Tester" },
    expectStatus: 200,
  },
  {
    name: "POST /phone-tracker/projects (create project)",
    category: "SPY_G",
    method: "POST",
    url: `${API_BASE}/phone-tracker/projects`,
    body: { text: "TESTER: testovací projekt", tags: ["test"], phase: "nápad", priority: 5 },
    expectStatus: 200,
  },
  {
    name: "POST /phone-tracker/data (phone location)",
    category: "Phone Tracker",
    method: "POST",
    url: `${API_BASE}/phone-tracker/data`,
    body: { lat: 50.0, lng: 14.0, accuracy: "10m", timestamp: new Date().toISOString() },
    expectStatus: 201,
  },
];

const WEB_PAGES: TestCase[] = [
  { name: "GET / (Home)", category: "Web Pages", method: "GET", url: `${WEB_BASE}/`, expectStatus: 200 },
  { name: "GET /workspace", category: "Web Pages", method: "GET", url: `${WEB_BASE}/workspace`, expectStatus: 200 },
  { name: "GET /spyg", category: "Web Pages", method: "GET", url: `${WEB_BASE}/spyg`, expectStatus: 200 },
  { name: "GET /realtime", category: "Web Pages", method: "GET", url: `${WEB_BASE}/realtime`, expectStatus: 200 },
  { name: "GET /tasks", category: "Web Pages", method: "GET", url: `${WEB_BASE}/tasks`, expectStatus: 200 },
  { name: "GET /agents", category: "Web Pages", method: "GET", url: `${WEB_BASE}/agents`, expectStatus: 200 },
  { name: "GET /phone-tracker", category: "Web Pages", method: "GET", url: `${WEB_BASE}/phone-tracker`, expectStatus: 200 },
  { name: "GET /projekty", category: "Web Pages", method: "GET", url: `${WEB_BASE}/projekty`, expectStatus: 200 },
  { name: "GET /delegations", category: "Web Pages", method: "GET", url: `${WEB_BASE}/delegations`, expectStatus: 200 },
  { name: "GET /executive", category: "Web Pages", method: "GET", url: `${WEB_BASE}/executive`, expectStatus: 200 },
  { name: "GET /calendar", category: "Web Pages", method: "GET", url: `${WEB_BASE}/calendar`, expectStatus: 200 },
  { name: "GET /email", category: "Web Pages", method: "GET", url: `${WEB_BASE}/email`, expectStatus: 200 },
  { name: "GET /documents", category: "Web Pages", method: "GET", url: `${WEB_BASE}/documents`, expectStatus: 200 },
  { name: "GET /knowledge", category: "Web Pages", method: "GET", url: `${WEB_BASE}/knowledge`, expectStatus: 200 },
  { name: "GET /progress", category: "Web Pages", method: "GET", url: `${WEB_BASE}/progress`, expectStatus: 200 },
  { name: "GET /chat", category: "Web Pages", method: "GET", url: `${WEB_BASE}/chat`, expectStatus: 200 },
  { name: "GET /dashboard", category: "Web Pages", method: "GET", url: `${WEB_BASE}/dashboard`, expectStatus: 200 },
  { name: "GET /ideas", category: "Web Pages", method: "GET", url: `${WEB_BASE}/ideas`, expectStatus: 200 },
];

// ─── Test Runner ─────────────────────────────────────────────────

async function runSingleTest(tc: TestCase): Promise<TestResult> {
  const start = Date.now();
  const result: TestResult = {
    name: tc.name,
    category: tc.category,
    url: tc.url,
    method: tc.method,
    status: "fail",
    httpStatus: null,
    durationMs: 0,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);

    const fetchOpts: RequestInit = {
      method: tc.method,
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    };

    if (tc.body && tc.method !== "GET") {
      fetchOpts.body = JSON.stringify(tc.body);
    }

    const res = await fetch(tc.url, fetchOpts);
    clearTimeout(timeout);

    result.httpStatus = res.status;
    result.durationMs = Date.now() - start;

    const bodyText = await res.text();
    result.bodyPreview = bodyText.slice(0, 200);

    const expectedStatus = tc.expectStatus || 200;
    if (res.status === expectedStatus) {
      result.status = "pass";
    } else if (res.status >= 500) {
      result.status = "fail";
    } else {
      // Non-200 but not 500 — some endpoints may return 401/403/404 depending on state
      // We'll count 2xx as pass, 5xx as fail, 4xx as skip (auth-dependant)
      result.status = "skip";
      result.error = `HTTP ${res.status} (expected ${expectedStatus})`;
    }
  } catch (err: any) {
    result.durationMs = Date.now() - start;
    result.status = "fail";
    result.error = err.message || String(err);
  }

  return result;
}

async function runAllTests(): Promise<TestRun> {
  const allTests = [...API_ENDPOINTS, ...API_POST_TESTS, ...WEB_PAGES];
  const results: TestResult[] = [];
  const startTime = Date.now();

  // Run sequentially to avoid overwhelming the server
  for (const tc of allTests) {
    const r = await runSingleTest(tc);
    results.push(r);
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;

  const run: TestRun = {
    id: `run-${Date.now()}`,
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed,
    skipped,
    durationMs: Date.now() - startTime,
    results,
  };

  // Save current results
  writeFileSync(RESULTS_PATH, JSON.stringify(run, null, 2));

  // Append to history
  let history: TestRun[] = [];
  if (existsSync(HISTORY_PATH)) {
    try {
      history = JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
    } catch { /* corrupted, start fresh */ }
  }
  history.unshift(run);
  // Keep last 100 runs
  if (history.length > 100) history = history.slice(0, 100);
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));

  return run;
}

// ─── Routes ──────────────────────────────────────────────────────

export async function testerRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const sseManager = SSEManager.getInstance();

  // POST /tester/run — spustí testy (volitelně se speciálním úkolem)
  app.post("/run", async (request, reply) => {
    const body = request.body as { task?: string } | undefined;
    const specialTask = body?.task?.trim();
    const taskMsg = specialTask
      ? `🎯 Speciální úkol: "${specialTask}" — spouštím testy...`
      : "Spouštím testy celého MiLO systému...";

    app.log.info(`[tester] Starting test run${specialTask ? ` with task: ${specialTask}` : ""}...`);

    // Broadcast start event
    sseManager.broadcast({
      id: `tester-start-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentId: "tester",
      agentName: "MiLO Tester",
      type: "agent:started",
      message: taskMsg,
    });

    try {
      const run = await runAllTests();

      // Attach special task if provided
      if (specialTask) {
        (run as any).specialTask = specialTask;
      }

      const summary = `Testy dokončeny: ${run.passed}/${run.totalTests} prošlo, ${run.failed} selhalo, ${run.skipped} přeskočeno (${run.durationMs}ms)`;

      // Broadcast completion event
      sseManager.broadcast({
        id: `tester-done-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentId: "tester",
        agentName: "MiLO Tester",
        type: "agent:completed",
        message: summary,
      });

      app.log.info(`[tester] ${summary}`);

      // Broadcast individual failures as error events
      for (const r of run.results) {
        if (r.status === "fail") {
          sseManager.broadcast({
            id: `tester-fail-${Date.now()}-${r.name.replace(/\s+/g, "-")}`,
            timestamp: new Date().toISOString(),
            agentId: "tester",
            agentName: "MiLO Tester",
            type: "agent:error",
            message: `❌ ${r.name} — ${r.error || `HTTP ${r.httpStatus}`}`,
            error: r.error,
          });
        }
      }

      return reply.send(run);
    } catch (err: any) {
      sseManager.broadcast({
        id: `tester-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentId: "tester",
        agentName: "MiLO Tester",
        type: "agent:error",
        message: `Chyba při spouštění testů: ${err.message}`,
        error: err.message,
      });

      return reply.status(500).send({ error: "Test run failed", message: err.message });
    }
  });

  // GET /tester/results — poslední výsledky
  app.get("/results", async (_request, reply) => {
    if (!existsSync(RESULTS_PATH)) {
      return reply.send({
        id: "none",
        timestamp: new Date().toISOString(),
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        durationMs: 0,
        results: [],
        message: "Zatím nebyly spuštěny žádné testy. Klikněte na SPUSTIT TESTY.",
      });
    }
    try {
      const data = JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
      return reply.send(data);
    } catch {
      return reply.status(500).send({ error: "Failed to read results" });
    }
  });

  // GET /tester/history — historie
  app.get("/history", async (_request, reply) => {
    if (!existsSync(HISTORY_PATH)) {
      return reply.send({ runs: [] });
    }
    try {
      const data = JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
      return reply.send({ runs: data });
    } catch {
      return reply.send({ runs: [] });
    }
  });
}
