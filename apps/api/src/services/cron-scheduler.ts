import { checkBudgets } from "../services/budget-checker.js";
import { getPendingReviews } from "../services/reviews.js";
import { generateWeeklySummary } from "../services/weekly-summary.js";
import { getConfig } from "../services/config.js";
import { sendMorningBrief, getDeliveryStatus, resetDailyFlag } from "../modules/executive/morning-brief.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startCronScheduler(): void {
  if (cronInterval) return;

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

export function stopCronScheduler(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("[cron] Scheduler stopped");
  }
}
