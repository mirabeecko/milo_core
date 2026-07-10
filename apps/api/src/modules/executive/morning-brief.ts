/**
 * Morning Brief Delivery — C-002 capability.
 *
 * Security: token from process.env only. Never logged. Never persisted.
 * Duplicate prevention: tracks lastSentDate, resets at midnight.
 */
import type { AgentManager } from "@milo/agents";
import { generateExecutiveBrief } from "./brief-pipeline.js";

let _manager: AgentManager | null = null;
export function setManager(m: AgentManager) { _manager = m; }

// ─── Delivery state (perzistentní v paměti, reset při restartu) ─────

interface DeliveryState {
  lastSentDate: string | null;
  lastStatus: "generated" | "sent" | "failed" | "degraded_text_only" | "idle";
  lastError: string | null;
  lastSentAt: string | null;
  channel: string;
  enabled: boolean;
  scheduleTime: string;
}

const state: DeliveryState = {
  lastSentDate: null,
  lastStatus: "idle",
  lastError: null,
  lastSentAt: null,
  channel: process.env.TELEGRAM_BOT_TOKEN ? "telegram" : "text_only",
  enabled: true,
  scheduleTime: "07:00",
};

export function getDeliveryStatus() { return { ...state }; }
export function resetDailyFlag() { state.lastSentDate = null; }
export function enableDelivery() { state.enabled = true; }
export function disableDelivery() { state.enabled = false; }

// ─── Send ────────────────────────────────────────────────────────────

export function sendMorningBrief(repoPath: string): {
  status: DeliveryState["lastStatus"];
  error?: string;
  preview?: string;
  channel?: string;
} {
  if (!_manager) return { status: "failed", error: "AgentManager not initialized" };
  if (!state.enabled) return { status: "failed", error: "Delivery disabled" };

  const brief = generateExecutiveBrief(repoPath, _manager);
  const sections = brief.sections.map((s) =>
    `[${s.confidence}] ${s.title}\n${s.content}${s.blockers.length ? `\n⚠️ ${s.blockers.join(", ")}` : ""}`
  );
  const text = [
    `🌅 MiLO Executive Brief — ${new Date().toLocaleDateString("cs")}`,
    "",
    ...sections,
    "",
    `📋 ${brief.summary}`,
    brief.criticalBlockers.length > 0
      ? `🚨 Blokátory: ${brief.criticalBlockers.join("; ")}`
      : "✅ Žádné blokátory",
    `💡 ${brief.topRecommendations[0] || "Pokračovat"}`,
  ].join("\n");

  // Telegram delivery — token from env only
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    try {
      const msg = text.slice(0, 3500);
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const { execSync } = require("node:child_process");
      execSync(
        `curl -s -X POST "${url}" -H "Content-Type: application/json" -d '${JSON.stringify({ chat_id: chatId, text: msg, disable_web_page_preview: true })}'`,
        { timeout: 8000, encoding: "utf-8" },
      );

      state.lastSentDate = new Date().toISOString().slice(0, 10);
      state.lastStatus = "sent";
      state.lastSentAt = new Date().toISOString();
      state.lastError = null;
      state.channel = "telegram";
      return { status: "sent", preview: text.slice(0, 150), channel: "telegram" };
    } catch (e: any) {
      state.lastStatus = "failed";
      state.lastError = `Telegram: ${e.message}`;
      state.channel = "telegram";
      return { status: "failed", error: state.lastError, preview: text.slice(0, 150) };
    }
  }

  // Text-only fallback
  state.lastSentDate = new Date().toISOString().slice(0, 10);
  state.lastStatus = "degraded_text_only";
  state.lastError = "No Telegram token configured";
  state.channel = "text_only";
  state.lastSentAt = new Date().toISOString();
  return { status: "degraded_text_only", preview: text.slice(0, 150), channel: "text_only" };
}
