/**
 * Gmail Bridge — Node.js wrapper volající google_api.py (Python).
 *
 * Používá existující OAuth token v ~/.hermes/google_token.json.
 * google_api.py už máme ověřený — funguje pro search, get, send.
 */

import { execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(execFile);

function runGapi(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(PYTHON, [GAPI_SCRIPT, ...args], {
      timeout: 30000,
      maxBuffer: 1024 * 1024, // 1 MB
    }, (err, stdout) => {
      // google_api.py píše warnings na stderr, stdout obsahuje JSON
      if (err && !stdout) {
        reject(new Error(err.message));
      } else {
        resolve(stdout || "");
      }
    });
  });
}

const GAPI_SCRIPT = "/Users/mb/.hermes/skills/productivity/google-workspace/scripts/google_api.py";
const PYTHON = "python3";

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  labels: string[];
}

export interface GmailInboxResult {
  emails: EmailSummary[];
  total: number;
}

/** Prohledat inbox — výchozí posledních 7 dní */
export async function searchInbox(query = "newer_than:7d", max = 20): Promise<GmailInboxResult> {
  try {
    const stdout = await runGapi(["gmail", "search", query, "--max", String(max)]);

    // Odstranit Python warnings před JSON
    const jsonStart = stdout.indexOf("[");
    if (jsonStart === -1) throw new Error("No JSON array in output");

    const emails: EmailSummary[] = JSON.parse(stdout.slice(jsonStart));
    return { emails, total: emails.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gmail search failed: ${msg}`);
  }
}

/** Získat plné tělo emailu */
export async function getEmail(messageId: string): Promise<{ id: string; from: string; subject: string; body: string }> {
  try {
    const stdout = await runGapi(["gmail", "get", messageId]);
    const jsonStart = stdout.indexOf("{");
    if (jsonStart === -1) throw new Error("No JSON in output");
    return JSON.parse(stdout.slice(jsonStart));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gmail get failed: ${msg}`);
  }
}

/** Odeslat email */
export async function sendEmail(opts: { to: string; subject: string; body: string }): Promise<{ status: string; id: string }> {
  try {
    const stdout = await runGapi(["gmail", "send",
      "--to", opts.to,
      "--subject", opts.subject,
      "--body", opts.body,
    ]);
    const jsonStart = stdout.indexOf("{");
    if (jsonStart === -1) throw new Error("No JSON in output");
    return JSON.parse(stdout.slice(jsonStart));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gmail send failed: ${msg}`);
  }
}
