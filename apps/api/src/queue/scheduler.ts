import { connection, emailSyncQueue, calendarSyncQueue, driveSyncQueue, obsidianSyncQueue, briefingQueue } from "./index.js";

export function startScheduler(): void {
  emailSyncQueue.add(
    "sync-emails",
    {},
    { repeat: { pattern: "*/5 * * * *" }, jobId: "email-sync-repeat" }
  );

  calendarSyncQueue.add(
    "sync-calendar",
    {},
    { repeat: { pattern: "*/5 * * * *" }, jobId: "calendar-sync-repeat" }
  );

  driveSyncQueue.add(
    "sync-drive",
    {},
    { repeat: { pattern: "*/15 * * * *" }, jobId: "drive-sync-repeat" }
  );

  obsidianSyncQueue.add(
    "sync-obsidian",
    {},
    { repeat: { pattern: "*/30 * * * *" }, jobId: "obsidian-sync-repeat" }
  );

  briefingQueue.add(
    "generate-briefing",
    {},
    { repeat: { pattern: "0 7 * * *" }, jobId: "briefing-repeat" }
  );

  console.log("[scheduler] Cron jobs registered");
}
