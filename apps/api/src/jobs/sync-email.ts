import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EmailService } from "../modules/email/service.js";
import type { JobData } from "../infrastructure/queue.js";
import { JobName } from "../infrastructure/queue.js";
import { getGoogleTokens } from "../config/google-tokens.js";
import { updateSyncState } from "./sync-state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const EMAILS_FILE = path.join(DATA_DIR, "synced-emails.json");

interface StoredEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  date: string;
  snippet: string;
  bodyText: string | null;
  labels: string[];
  isUnread: boolean;
  syncedAt: string;
}

export async function syncEmailJob(data: JobData[JobName.SYNC_EMAIL]): Promise<{ count: number }> {
  const { userId } = data;

  console.log(`[job:sync:email] Starting email sync for user ${userId}`);

  const emailService = new EmailService();
  if (emailService.isDemo()) {
    console.log("[job:sync:email] Email service in demo mode, skipping sync");
    return { count: 0 };
  }

  const tokens = await getGoogleTokens(userId, "email");
  if (!tokens) {
    console.log(`[job:sync:email] No Google tokens for user ${userId}, skipping sync`);
    return { count: 0 };
  }

  const emails = await emailService.listEmails(userId, tokens.accessToken, tokens.refreshToken, 50);

  const stored: StoredEmail[] = emails.map((email) => ({
    id: email.id,
    threadId: email.threadId,
    subject: email.subject,
    from: email.from,
    to: email.to,
    date: email.date instanceof Date ? email.date.toISOString() : String(email.date),
    snippet: email.snippet,
    bodyText: email.bodyText,
    labels: email.labels,
    isUnread: email.isUnread,
    syncedAt: new Date().toISOString(),
  }));

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(EMAILS_FILE, JSON.stringify(stored, null, 2), "utf-8");

  await updateSyncState(userId, "email", stored.length);

  console.log(`[job:sync:email] Synced ${stored.length} emails for user ${userId}`);
  return { count: stored.length };
}

export async function getSyncedEmails(): Promise<StoredEmail[]> {
  try {
    const raw = await fs.readFile(EMAILS_FILE, "utf-8");
    return JSON.parse(raw) as StoredEmail[];
  } catch {
    return [];
  }
}
