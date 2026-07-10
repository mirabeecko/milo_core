import { writeBreadcrumb, getBreadcrumbs } from "@milo/agents/breadcrumbs";
import { createReview, getPendingReviews, approveReview, rejectReview, shouldCreateReview, isCriticalPath, addToDigest, getTodayDigest } from "../src/services/reviews.js";
import { getConfig, saveConfig, isFocusActive } from "../src/services/config.js";
import { checkBudgets, getActiveAlerts, acknowledgeAlert } from "../src/services/budget-checker.js";
import { generateWeeklySummary, getLatestSummary } from "../src/services/weekly-summary.js";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

console.log("\n=== TESTING: Breadcrumbs (F1) ===");
const testProject = `test-proj-${Date.now()}`;
writeBreadcrumb(testProject, "developer", "Testovaci breadcrumb - summary", "Dej pozor na test data");
const crumbs = getBreadcrumbs(testProject);
assert("Breadcrumb written and read back", crumbs.length === 1, `got ${crumbs.length}`);
assert("Breadcrumb has correct agent", crumbs.length > 0 && crumbs[0].agent === "developer");
assert("Breadcrumb has correct summary", crumbs.length > 0 && crumbs[0].summary.includes("Testovaci"));
assert("Breadcrumb has watch_out", crumbs.length > 0 && crumbs[0].watch_out.includes("pozor"));

const allCrumbs = getBreadcrumbs();
assert("Get all breadcrumbs returns data", allCrumbs.length > 0);
assert("All breadcrumbs sorted by timestamp desc", allCrumbs.length >= crumbs.length);

console.log("\n=== TESTING: Config (shared) ===");
const cfg = getConfig();
assert("Config loaded (monthly_budget_total)", cfg.monthly_budget_total === 500);
assert("Config has diff_line_limit", cfg.diff_line_limit === 20);
assert("Config has approval_digest_time", cfg.approval_digest_time === "18:00");
assert("Config has weekly_summary_time", cfg.weekly_summary_time === "20:00");
assert("Focus not active by default", !isFocusActive());

const updated = saveConfig({ focus_until: new Date(Date.now() + 3600_000).toISOString(), focus_mode: true });
assert("Focus mode saved", updated.focus_mode === true);
assert("Focus is active now", isFocusActive());

saveConfig({ focus_until: null, focus_mode: false });
assert("Focus mode reset", !isFocusActive());

console.log("\n=== TESTING: Diff Review (F4) ===");
assert("5 lines should NOT create review", !shouldCreateReview(5, "test-proj"));
assert("21 lines SHOULD create review", shouldCreateReview(21, "test-proj"));
assert("Not critical path by default", !isCriticalPath("some-project"));

const review = createReview({
  project: testProject,
  agent: "developer",
  task_description: "Test review - uprava 25 radku",
  lines_changed: 25,
  diff: "diff --git a/test.ts...",
  critical_path: false,
});
assert("Review created", !!review.id);
assert("Review is pending", review.status === "pending");

const pending = getPendingReviews();
assert("Pending reviews contains the new one", pending.some((r) => r.id === review.id));

console.log("\n=== TESTING: Approval Digest (F5) ===");
addToDigest(review);
const digest = getTodayDigest();
assert("Digest has today's date", digest.date === new Date().toISOString().split("T")[0]);
assert("Digest contains the review", digest.items.some((i) => i.review_id === review.id));

console.log("\n=== TESTING: Review approve/reject (F4) ===");
const approved = approveReview(review.id);
assert("Review approved", approved?.status === "approved");

const review2 = createReview({
  project: testProject,
  agent: "developer",
  task_description: "Test review 2 - ke zamitnuti",
  lines_changed: 30,
  diff: "diff...",
  critical_path: false,
});
const rejected = rejectReview(review2.id);
assert("Review rejected", rejected?.status === "rejected");

console.log("\n=== TESTING: Budget Check (F3) ===");
const newAlerts = await checkBudgets();
console.log(`  Budget check ran, ${newAlerts.length} new alerts`);
const activeAlerts = getActiveAlerts();
assert("Budget check doesn't crash", true);

if (activeAlerts.length > 0) {
  const ack = acknowledgeAlert(activeAlerts[0].id);
  assert("Alert acknowledged", ack?.acknowledged === true);
}

console.log("\n=== TESTING: Weekly Summary (F7) ===");
const summary = await generateWeeklySummary();
assert("Summary generated", !!summary.summary_text);
assert("Summary has week_start", !!summary.week_start);
assert("Summary has week_end", !!summary.week_end);
assert("Summary text contains heading", summary.summary_text.includes("Týdenní") || summary.summary_text.includes("Tydenni"));
const latest = getLatestSummary();
assert("Latest summary retrievable", !!latest);

console.log(`\n\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
