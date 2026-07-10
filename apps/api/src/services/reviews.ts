import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getConfig } from "../services/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");
const REVIEWS_FILE = join(DATA_DIR, "reviews.json");
const APPROVAL_DIGEST_FILE = join(DATA_DIR, "approval-digest.json");

export interface ReviewEntry {
  id: string;
  project: string;
  agent: string;
  task_description: string;
  lines_changed: number;
  diff: string;
  critical_path: boolean;
  second_opinion_diff?: string;
  second_opinion_model?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at?: string;
}

function loadReviews(): ReviewEntry[] {
  try {
    if (!existsSync(REVIEWS_FILE)) return [];
    const data = JSON.parse(readFileSync(REVIEWS_FILE, "utf-8"));
    return Array.isArray(data.reviews) ? data.reviews : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews: ReviewEntry[]): void {
  writeFileSync(REVIEWS_FILE, JSON.stringify({ reviews }, null, 2));
}

export function createReview(entry: Omit<ReviewEntry, "id" | "status" | "created_at">): ReviewEntry {
  const reviews = loadReviews();
  const review: ReviewEntry = {
    ...entry,
    id: crypto.randomUUID(),
    status: "pending",
    created_at: new Date().toISOString(),
  };
  reviews.push(review);
  saveReviews(reviews);
  return review;
}

export function getPendingReviews(): ReviewEntry[] {
  return loadReviews().filter((r) => r.status === "pending");
}

export function getReview(id: string): ReviewEntry | null {
  return loadReviews().find((r) => r.id === id) ?? null;
}

export function approveReview(id: string): ReviewEntry | null {
  const reviews = loadReviews();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  reviews[idx].status = "approved";
  reviews[idx].resolved_at = new Date().toISOString();
  saveReviews(reviews);
  return reviews[idx];
}

export function rejectReview(id: string): ReviewEntry | null {
  const reviews = loadReviews();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  reviews[idx].status = "rejected";
  reviews[idx].resolved_at = new Date().toISOString();
  saveReviews(reviews);
  return reviews[idx];
}

export function shouldCreateReview(linesChanged: number, _project: string): boolean {
  const cfg = getConfig();
  if (linesChanged <= cfg.diff_line_limit) return false;
  return true;
}

export function isCriticalPath(project: string): boolean {
  const cfg = getConfig();
  return cfg.critical_paths.some((cp) => project.includes(cp) || cp.includes(project));
}

export interface ApprovalDigest {
  date: string;
  time: string;
  sent: boolean;
  items: Array<{
    review_id: string;
    project: string;
    agent: string;
    description: string;
    lines_changed: number;
  }>;
}

function loadDigest(): ApprovalDigest {
  try {
    if (!existsSync(APPROVAL_DIGEST_FILE)) return { date: "", time: "", sent: true, items: [] };
    return JSON.parse(readFileSync(APPROVAL_DIGEST_FILE, "utf-8"));
  } catch {
    return { date: "", time: "", sent: true, items: [] };
  }
}

export function saveDigest(digest: ApprovalDigest): void {
  writeFileSync(APPROVAL_DIGEST_FILE, JSON.stringify(digest, null, 2));
}

export function addToDigest(review: ReviewEntry): void {
  const digest = loadDigest();
  const today = new Date().toISOString().split("T")[0]!;
  const cfg = getConfig();

  if (digest.date !== today) {
    digest.date = today;
    digest.time = cfg.approval_digest_time;
    digest.sent = false;
    digest.items = [];
  }

  digest.items.push({
    review_id: review.id,
    project: review.project,
    agent: review.agent,
    description: review.task_description,
    lines_changed: review.lines_changed,
  });

  saveDigest(digest);
}

export function getTodayDigest(): ApprovalDigest {
  const digest = loadDigest();
  const today = new Date().toISOString().split("T")[0]!;
  if (digest.date !== today) {
    return { date: today, time: getConfig().approval_digest_time, sent: false, items: [] };
  }
  return digest;
}

export function markDigestSent(): void {
  const digest = loadDigest();
  digest.sent = true;
  saveDigest(digest);
}
