import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { connection } from "./index.js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getTokensForService(userId: string, service: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("accounts")
    .select("access_token, refresh_token")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("service", service)
    .single();
  if (!data?.access_token) return null;
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export const emailSyncWorker = new Worker(
  "email-sync",
  async (job) => {
    const userId = (job.data?.userId as string) || "demo";
    console.log(`[email-sync] Processing for user ${userId}`);

    const supabase = getSupabase();
    if (!supabase) {
      console.log("[email-sync] Supabase not configured — skipping");
      return { synced: 0, demo: true };
    }

    const tokens = await getTokensForService(userId, "gmail");
    if (!tokens) {
      console.log("[email-sync] No Gmail tokens — skipping");
      return { synced: 0, demo: true };
    }

    try {
      const { EmailService } = await import("../modules/email/service.js");
      const service = new EmailService();
      const emails = await service.listEmails(userId, tokens.accessToken, tokens.refreshToken, 50);

      if (emails.length === 0) return { synced: 0, demo: false };

      const { error, count } = await supabase.from("emails").upsert(
        emails.map((e) => ({
          user_id: userId,
          gmail_id: e.id,
          thread_id: e.threadId,
          subject: e.subject,
          from_address: e.from,
          snippet: e.snippet,
          labels: e.labels || [],
          is_read: e.isRead || false,
          is_important: e.isImportant || false,
          has_attachments: e.hasAttachments || false,
          received_at: e.date,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,gmail_id" }
      );

      if (error) throw error;
      console.log(`[email-sync] Synced ${count ?? emails.length} emails`);
      return { synced: count ?? emails.length };
    } catch (err) {
      console.error("[email-sync] Error:", err);
      throw err;
    }
  },
  { connection, autorun: true }
);

export const calendarSyncWorker = new Worker(
  "calendar-sync",
  async (job) => {
    const userId = (job.data?.userId as string) || "demo";
    console.log(`[calendar-sync] Processing for user ${userId}`);

    const supabase = getSupabase();
    if (!supabase) {
      console.log("[calendar-sync] Supabase not configured — skipping");
      return { synced: 0, demo: true };
    }

    const tokens = await getTokensForService(userId, "calendar");
    if (!tokens) {
      console.log("[calendar-sync] No Calendar tokens — skipping");
      return { synced: 0, demo: true };
    }

    try {
      const { CalendarService } = await import("../modules/calendar/service.js");
      const service = new CalendarService();
      const events = await service.listEvents(userId, tokens.accessToken, tokens.refreshToken, 50);

      if (events.length === 0) return { synced: 0, demo: false };

      const { error, count } = await supabase.from("calendar_events").upsert(
        events.map((e) => ({
          user_id: userId,
          google_event_id: e.id,
          summary: e.summary,
          description: e.description,
          location: e.location,
          start_time: e.start?.dateTime || e.start?.date,
          end_time: e.end?.dateTime || e.end?.date,
          is_all_day: !!e.start?.date,
          attendees: e.attendees?.map((a: { email: string }) => a.email) || [],
          status: e.status,
          calendar_id: e.calendarId,
          color: e.color,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,google_event_id" }
      );

      if (error) throw error;
      console.log(`[calendar-sync] Synced ${count ?? events.length} events`);
      return { synced: count ?? events.length };
    } catch (err) {
      console.error("[calendar-sync] Error:", err);
      throw err;
    }
  },
  { connection, autorun: true }
);

export const driveSyncWorker = new Worker(
  "drive-sync",
  async (job) => {
    const userId = (job.data?.userId as string) || "demo";
    console.log(`[drive-sync] Processing for user ${userId}`);

    const supabase = getSupabase();
    if (!supabase) {
      console.log("[drive-sync] Supabase not configured — skipping");
      return { synced: 0, demo: true };
    }

    const tokens = await getTokensForService(userId, "drive");
    if (!tokens) {
      console.log("[drive-sync] No Drive tokens — skipping");
      return { synced: 0, demo: true };
    }

    try {
      const { DocumentsService } = await import("../modules/documents/service.js");
      const service = new DocumentsService();
      const files = await service.listFiles(tokens.accessToken, 50);

      if (files.length === 0) return { synced: 0, demo: false };

      const { error, count } = await supabase.from("drive_files").upsert(
        files.map((f) => ({
          user_id: userId,
          google_file_id: f.id,
          name: f.name,
          mime_type: f.mimeType,
          size_bytes: f.size ? parseInt(f.size, 10) : null,
          web_view_link: f.webViewLink,
          modified_at: f.modifiedTime,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,google_file_id" }
      );

      if (error) throw error;
      console.log(`[drive-sync] Synced ${count ?? files.length} files`);
      return { synced: count ?? files.length };
    } catch (err) {
      console.error("[drive-sync] Error:", err);
      throw err;
    }
  },
  { connection, autorun: true }
);

export const obsidianSyncWorker = new Worker(
  "obsidian-sync",
  async (job) => {
    const userId = (job.data?.userId as string) || "demo";
    console.log(`[obsidian-sync] Processing for user ${userId}`);

    const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
    if (!vaultPath) {
      console.log("[obsidian-sync] OBSIDIAN_VAULT_PATH not set — skipping");
      return { synced: 0, demo: true };
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.log("[obsidian-sync] Supabase not configured — skipping");
      return { synced: 0, demo: true };
    }

    try {
      const { readdirSync, readFileSync, statSync } = await import("fs");
      const { join, relative } = await import("path");

      const notes: Array<{
        user_id: string;
        file_path: string;
        title: string;
        content: string;
        tags: string[];
        modified_at: string;
        synced_at: string;
      }> = [];

      function scanDir(dir: string) {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".md")) {
            try {
              const stat = statSync(fullPath);
              const content = readFileSync(fullPath, "utf-8");
              const title = entry.name.replace(/\.md$/, "");

              const tagMatches = content.match(/#[\w-/]+/g) || [];
              const tags = [...new Set(tagMatches.map((t) => t.replace(/^#/, "")))];

              notes.push({
                user_id: userId,
                file_path: relative(vaultPath, fullPath),
                title,
                content,
                tags,
                modified_at: stat.mtime.toISOString(),
                synced_at: new Date().toISOString(),
              });
            } catch {
              // Skip files that can't be read
            }
          }
        }
      }

      scanDir(vaultPath);

      if (notes.length === 0) return { synced: 0 };

      let synced = 0;
      for (let i = 0; i < notes.length; i += 50) {
        const batch = notes.slice(i, i + 50);
        const { error } = await supabase.from("obsidian_notes").upsert(batch, {
          onConflict: "user_id,file_path",
        });
        if (error) {
          console.error("[obsidian-sync] Batch error:", error);
        } else {
          synced += batch.length;
        }
      }

      console.log(`[obsidian-sync] Synced ${synced} notes`);
      return { synced };
    } catch (err) {
      console.error("[obsidian-sync] Error:", err);
      throw err;
    }
  },
  { connection, autorun: true }
);

export const briefingWorker = new Worker(
  "briefing-generate",
  async (job) => {
    const userId = (job.data?.userId as string) || "demo";
    console.log(`[briefing-generate] Generating briefing for user ${userId}`);

    const supabase = getSupabase();
    if (!supabase) {
      console.log("[briefing-generate] Supabase not configured — skipping");
      return { generated: false, demo: true };
    }

    try {
      const { count: emailCount } = await supabase
        .from("emails")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: eventCount } = await supabase
        .from("calendar_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: fileCount } = await supabase
        .from("drive_files")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: noteCount } = await supabase
        .from("obsidian_notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const content =
        `# Daily Briefing\n\n` +
        `Generated: ${new Date().toLocaleString("cs-CZ")}\n\n` +
        `## Summary\n` +
        `- 📧 ${emailCount ?? 0} emails synced\n` +
        `- 📅 ${eventCount ?? 0} calendar events\n` +
        `- 📁 ${fileCount ?? 0} drive files\n` +
        `- 📝 ${noteCount ?? 0} obsidian notes\n`;

      const { error } = await supabase.from("briefings").insert({
        user_id: userId,
        content,
        version: "3.0",
        summary: `${emailCount ?? 0} emails, ${eventCount ?? 0} events, ${fileCount ?? 0} files, ${noteCount ?? 0} notes`,
        blocker_count: 0,
        section_count: 4,
      });

      if (error) throw error;
      console.log("[briefing-generate] Briefing created");
      return { generated: true };
    } catch (err) {
      console.error("[briefing-generate] Error:", err);
      throw err;
    }
  },
  { connection, autorun: true }
);

export const knowledgeIndexWorker = new Worker(
  "knowledge-index",
  async (job) => {
    const userId = (job.data?.userId as string) || "demo";
    console.log(`[knowledge-index] Indexing for user ${userId}`);

    const supabase = getSupabase();
    if (!supabase) {
      console.log("[knowledge-index] Supabase not configured — skipping");
      return { indexed: 0, demo: true };
    }

    try {
      const { data: notes } = await supabase
        .from("obsidian_notes")
        .select("id, content")
        .eq("user_id", userId)
        .limit(100);

      if (!notes?.length) return { indexed: 0 };

      let indexed = 0;
      for (const note of notes) {
        if (!note.content) continue;

        const paragraphs = note.content.split(/\n\n+/);
        const chunks: Array<{
          user_id: string;
          source_type: "note";
          source_id: string;
          chunk_index: number;
          content: string;
          token_count: number;
        }> = [];

        let currentChunk = "";
        for (const para of paragraphs) {
          if ((currentChunk + para).length > 1000 && currentChunk) {
            chunks.push({
              user_id: userId,
              source_type: "note",
              source_id: note.id,
              chunk_index: chunks.length,
              content: currentChunk.trim(),
              token_count: Math.ceil(currentChunk.length / 4),
            });
            currentChunk = para;
          } else {
            currentChunk += (currentChunk ? "\n\n" : "") + para;
          }
        }
        if (currentChunk.trim()) {
          chunks.push({
            user_id: userId,
            source_type: "note",
            source_id: note.id,
            chunk_index: chunks.length,
            content: currentChunk.trim(),
            token_count: Math.ceil(currentChunk.length / 4),
          });
        }

        if (chunks.length > 0) {
          const { error } = await supabase.from("knowledge_chunks").insert(chunks);
          if (!error) indexed += chunks.length;
        }
      }

      console.log(`[knowledge-index] Indexed ${indexed} chunks`);
      return { indexed };
    } catch (err) {
      console.error("[knowledge-index] Error:", err);
      throw err;
    }
  },
  { connection, autorun: true }
);

export async function closeWorkers(): Promise<void> {
  await Promise.all([
    emailSyncWorker.close(),
    calendarSyncWorker.close(),
    driveSyncWorker.close(),
    obsidianSyncWorker.close(),
    briefingWorker.close(),
    knowledgeIndexWorker.close(),
  ]);
}
