import { checkBudgets } from "../services/budget-checker.js";
import { getPendingReviews } from "../services/reviews.js";
import { generateWeeklySummary } from "../services/weekly-summary.js";
import { getConfig } from "../services/config.js";
import { sendMorningBrief, getDeliveryStatus, resetDailyFlag } from "../modules/executive/morning-brief.js";
import { miloQueue as queue } from "../infrastructure/queue.js";
import { JobName } from "../infrastructure/queue.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");

let cronInterval: ReturnType<typeof setInterval> | null = null;
let repeatableJobIds: string[] = [];

const SYNC_USER_ID = "demo-user";

export async function startCronScheduler(): Promise<void> {
  if (cronInterval) return;

  await scheduleRepeatableJobs();

  cronInterval = setInterval(async () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const cfg = getConfig();
    const dayOfWeek = now.getDay();

    try {
      await checkBudgets();
    } catch (err) {
      console.error("[cron] Budget check failed:", err);
    }

    // MiLO Tester: run every 30 minutes
    if (now.getMinutes() % 30 === 0) {
      try {
        const res = await fetch("http://localhost:4000/tester/run", { method: "POST" });
        const data = await res.json() as any;
        console.log(`[cron][tester] Auto-test: ${data.passed}/${data.totalTests} passed, ${data.failed} failed (${data.durationMs}ms)`);
      } catch (err) {
        console.error("[cron][tester] Auto-test failed:", err);
      }
    }

    if (timeStr === cfg.approval_digest_time) {
      try {
        const pending = getPendingReviews();
        if (pending.length > 0) {
          console.log(`[cron] Approval digest triggered at ${cfg.approval_digest_time}, ${pending.length} pending reviews`);
        }
      } catch (err) {
        console.error("[cron] Approval digest failed:", err);
      }
    }

    if (timeStr === cfg.weekly_summary_time && dayOfWeek === 0) {
      try {
        await generateWeeklySummary();
        console.log(`[cron] Weekly summary generated at ${timeStr}`);
      } catch (err) {
        console.error("[cron] Weekly summary failed:", err);
      }
    }

    // Morning brief at 07:00 Europe/Rome
    if (timeStr === "07:00") {
      const today = now.toISOString().slice(0, 10);
      const status = getDeliveryStatus();
      if (status.lastSentDate !== today) {
        try {
          const result = sendMorningBrief(REPO_ROOT);
          console.log(`[cron] Morning brief: ${result.status}${result.error ? ` (${result.error})` : ""}`);
        } catch (err) {
          console.error("[cron] Morning brief failed:", err);
        }
      }
    }

    // Reset daily flag at midnight
    if (timeStr === "00:00") {
      resetDailyFlag();
    }
  }, 60_000);

  console.log("[cron] Scheduler started (checking every 60s)");
}

async function scheduleRepeatableJobs(): Promise<void> {
  try {
    const emailJob = await queue.add(JobName.SYNC_EMAIL, { userId: SYNC_USER_ID }, {
      repeat: { pattern: "*/5 * * * *" },
      jobId: "repeat:sync:email",
    });
    if (emailJob?.id) repeatableJobIds.push(emailJob.id);
    console.log("[cron] Scheduled repeatable job: sync:email (every 5 min)");
  } catch (err) {
    console.warn("[cron] Failed to schedule repeatable sync:email:", err);
  }

  try {
    const calendarJob = await queue.add(JobName.SYNC_CALENDAR, { userId: SYNC_USER_ID }, {
      repeat: { pattern: "*/15 * * * *" },
      jobId: "repeat:sync:calendar",
    });
    if (calendarJob?.id) repeatableJobIds.push(calendarJob.id);
    console.log("[cron] Scheduled repeatable job: sync:calendar (every 15 min)");
  } catch (err) {
    console.warn("[cron] Failed to schedule repeatable sync:calendar:", err);
  }

  try {
    const driveJob = await queue.add(JobName.SYNC_DRIVE, { userId: SYNC_USER_ID }, {
      repeat: { pattern: "*/30 * * * *" },
      jobId: "repeat:sync:drive",
    });
    if (driveJob?.id) repeatableJobIds.push(driveJob.id);
    console.log("[cron] Scheduled repeatable job: sync:drive (every 30 min)");
  } catch (err) {
    console.warn("[cron] Failed to schedule repeatable sync:drive:", err);
  }

  try {
    const embeddingsJob = await queue.add(JobName.GENERATE_EMBEDDINGS, { documentId: "index" }, {
      repeat: { pattern: "0 * * * *" },
      jobId: "repeat:generate:embeddings",
    });
    if (embeddingsJob?.id) repeatableJobIds.push(embeddingsJob.id);
    console.log("[cron] Scheduled repeatable job: generate:embeddings (every hour)");
  } catch (err) {
    console.warn("[cron] Failed to schedule repeatable generate:embeddings:", err);
  }
}

export async function stopCronScheduler(): Promise<void> {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("[cron] Scheduler stopped");
  }

  for (const jobId of repeatableJobIds) {
    try {
      await queue.removeRepeatableByKey(jobId);
    } catch {
      // ignore cleanup errors
    }
  }
  repeatableJobIds = [];
}
