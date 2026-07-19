import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CalendarClient } from "@milo/tools";
import type { JobData } from "../infrastructure/queue.js";
import { JobName } from "../infrastructure/queue.js";
import { getGoogleTokens, setGoogleTokens } from "../config/google-tokens.js";
import { config } from "../config/index.js";
import { updateSyncState } from "./sync-state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const EVENTS_FILE = path.join(DATA_DIR, "synced-calendar-events.json");

interface StoredCalendarEvent {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  isAllDay: boolean;
  organizer: string | null;
  attendees: string[];
  status: string;
  htmlLink: string | null;
  syncedAt: string;
}

function isConfigured(): boolean {
  return Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI);
}

export async function syncCalendarJob(data: JobData[JobName.SYNC_CALENDAR]): Promise<{ count: number }> {
  const { userId } = data;

  console.log(`[job:sync:calendar] Starting calendar sync for user ${userId}`);

  if (!isConfigured()) {
    console.log("[job:sync:calendar] Google OAuth not configured, skipping sync");
    return { count: 0 };
  }

  const tokens = await getGoogleTokens(userId, "calendar");
  if (!tokens) {
    console.log(`[job:sync:calendar] No Google tokens for user ${userId}, skipping sync`);
    return { count: 0 };
  }

  const client = new CalendarClient({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    onTokensRefreshed: (newTokens) => void setGoogleTokens(userId, "calendar", newTokens),
  });

  const now = new Date();
  const endOfMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = await client.listEvents({
    maxResults: 100,
    timeMin: now,
    timeMax: endOfMonth,
  });

  const stored: StoredCalendarEvent[] = events.map((event) => ({
    id: event.id,
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: event.start instanceof Date ? event.start.toISOString() : String(event.start),
    end: event.end instanceof Date ? event.end.toISOString() : String(event.end),
    isAllDay: event.isAllDay,
    organizer: event.organizer,
    attendees: event.attendees,
    status: event.status,
    htmlLink: event.htmlLink,
    syncedAt: new Date().toISOString(),
  }));

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(EVENTS_FILE, JSON.stringify(stored, null, 2), "utf-8");

  await updateSyncState(userId, "calendar", stored.length);

  console.log(`[job:sync:calendar] Synced ${stored.length} events for user ${userId}`);
  return { count: stored.length };
}

export async function getSyncedCalendarEvents(): Promise<StoredCalendarEvent[]> {
  try {
    const raw = await fs.readFile(EVENTS_FILE, "utf-8");
    return JSON.parse(raw) as StoredCalendarEvent[];
  } catch {
    return [];
  }
}
