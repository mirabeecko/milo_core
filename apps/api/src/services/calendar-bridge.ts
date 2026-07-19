/**
 * Calendar Bridge — Node.js wrapper volající google_api.py (Python).
 *
 * Používá existující OAuth token v ~/.hermes/google_token.json.
 */

import { execFile } from "child_process";

const GAPI_SCRIPT = "/Users/mb/.hermes/skills/productivity/google-workspace/scripts/google_api.py";
const PYTHON = "python3";

function runGapi(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(PYTHON, [GAPI_SCRIPT, ...args], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    }, (err, stdout) => {
      if (err && !stdout) reject(new Error(err.message));
      else resolve(stdout || "");
    });
  });
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  htmlLink: string;
}

/** Vypsat události — výchozí příštích 7 dní */
export async function listEvents(max = 20): Promise<CalendarEvent[]> {
  try {
    const stdout = await runGapi(["calendar", "list", "--max", String(max)]);
    const jsonStart = stdout.indexOf("[");
    if (jsonStart === -1) throw new Error("No JSON array in output");
    return JSON.parse(stdout.slice(jsonStart));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Calendar list failed: ${msg}`);
  }
}

export async function createEvent(opts: {
  summary: string;
  start: string;
  end: string;
  location?: string;
}): Promise<{ status: string; id: string; summary: string; htmlLink: string }> {
  try {
    const args = ["calendar", "create", "--summary", opts.summary, "--start", opts.start, "--end", opts.end];
    if (opts.location) args.push("--location", opts.location);
    const stdout = await runGapi(args);
    const jsonStart = stdout.indexOf("{");
    if (jsonStart === -1) throw new Error("No JSON in output");
    return JSON.parse(stdout.slice(jsonStart));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Calendar create failed: ${msg}`);
  }
}
