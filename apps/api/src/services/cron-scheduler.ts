import { checkBudgets } from "../services/budget-checker.js";
import { getPendingReviews } from "../services/reviews.js";
import { generateWeeklySummary } from "../services/weekly-summary.js";
import { getConfig } from "../services/config.js";

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
