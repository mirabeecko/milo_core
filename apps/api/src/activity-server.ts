/**
 * Activity Server — samostatný server pro Activity SSE, Gmail a Calendar.
 *
 * Port: 4001
 * Spuštění: npx tsx src/activity-server.ts
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { activityRoutes } from "./modules/activity/routes.js";
import { searchInbox, getEmail } from "./services/gmail-bridge.js";
import { listEvents, createEvent } from "./services/calendar-bridge.js";

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, { origin: true });
  await app.register(activityRoutes);

  // ─── Gmail endpoints ───────────────────────────────────────────

  app.get("/api/gmail/inbox", async () => {
    try {
      const result = await searchInbox("newer_than:7d", 20);
      return { status: "ok", ...result };
    } catch (err) {
      return { status: "error", error: String(err) };
    }
  });

  app.get("/api/gmail/message/:id", async (req) => {
    try {
      const { id } = req.params as { id: string };
      const msg = await getEmail(id);
      return { status: "ok", ...msg };
    } catch (err) {
      return { status: "error", error: String(err) };
    }
  });

  // ─── Calendar endpoints ────────────────────────────────────────

  app.get("/api/calendar/today", async () => {
    try {
      const events = await listEvents(20);
      const today = new Date().toISOString().slice(0, 10);
      const todaysEvents = events.filter((e) => e.start.startsWith(today));
      return { status: "ok", events: todaysEvents, total: todaysEvents.length };
    } catch (err) {
      return { status: "error", error: String(err) };
    }
  });

  app.get("/api/calendar/upcoming", async () => {
    try {
      const events = await listEvents(20);
      return { status: "ok", events, total: events.length };
    } catch (err) {
      return { status: "error", error: String(err) };
    }
  });

  app.post("/api/calendar/event", async (req) => {
    try {
      const { summary, start, end, location } = req.body as {
        summary: string;
        start: string;
        end: string;
        location?: string;
      };
      const result = await createEvent({ summary, start, end, location });
      return { status: "ok", ...result };
    } catch (err) {
      return { status: "error", error: String(err) };
    }
  });

  try {
    await app.listen({ port: 4001, host: "0.0.0.0" });
    console.log("✅ Activity server běží na http://localhost:4001");
    console.log("   SSE stream:     GET  /api/activity/stream");
    console.log("   Spustit agenty: POST /api/agents/run");
    console.log("   Stav:           GET  /api/agents/status");
    console.log("   Gmail inbox:    GET  /api/gmail/inbox");
    console.log("   Kalendář:       GET  /api/calendar/today");
    console.log("   Kalendář vše:   GET  /api/calendar/upcoming");
  } catch (err) {
    console.error("Failed to start activity server:", err);
    process.exit(1);
  }
}

start();
