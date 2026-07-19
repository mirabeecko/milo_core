/**
 * Google Workspace Bridge — jednotný TypeScript bridge pro Gmail, Calendar, Drive, Contacts.
 *
 * Načítá OAuth token z ~/.hermes/google_token.json a automaticky obnovuje
 * access token pomocí refresh_token když expiruje. Obnovený token se persistuje
 * zpět do souboru.
 *
 * Používá nativní googleapis npm balíček místo Python skriptu google_api.py.
 */

import { readFileSync, writeFileSync } from "fs";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import type { gmail_v1, calendar_v3, drive_v3, people_v1 } from "googleapis";

const TOKEN_PATH = "/Users/mb/.hermes/google_token.json";

interface GoogleTokenData {
  token: string;
  refresh_token: string;
  client_id: string;
  client_secret: string;
  expiry: string;
}

let _authClient: OAuth2Client | null = null;

/** Načte OAuth2 klienta z token souboru — při prvním volání, pak cache. */
function loadAuthClient(): OAuth2Client {
  if (_authClient) return _authClient;

  const raw = JSON.parse(readFileSync(TOKEN_PATH, "utf-8")) as GoogleTokenData;

  const client = new OAuth2Client(raw.client_id, raw.client_secret);
  client.setCredentials({
    refresh_token: raw.refresh_token,
    access_token: raw.token,
    expiry_date: raw.expiry ? new Date(raw.expiry).getTime() : undefined,
  });

  // Persist refreshed tokens back to file when auto-refreshed
  client.on("tokens", (tokens) => {
    if (tokens.access_token) raw.token = tokens.access_token;
    if (tokens.expiry_date) raw.expiry = new Date(tokens.expiry_date).toISOString();
    try {
      writeFileSync(TOKEN_PATH, JSON.stringify(raw, null, 2));
    } catch {
      // can't write — ignore (read-only filesystem apod.)
    }
  });

  _authClient = client;
  return client;
}

/** Vrátí sdíleného OAuth2 klienta. */
export function getAuthClient(): OAuth2Client {
  return loadAuthClient();
}

/** Vrátí Gmail API klienta (v1). */
export function getGmailClient(): gmail_v1.Gmail {
  return google.gmail({ version: "v1", auth: loadAuthClient() as any });
}

/** Vrátí Google Calendar API klienta (v3). */
export function getCalendarClient(): calendar_v3.Calendar {
  return google.calendar({ version: "v3", auth: loadAuthClient() as any });
}

/** Vrátí Google Drive API klienta (v3). */
export function getDriveClient(): drive_v3.Drive {
  return google.drive({ version: "v3", auth: loadAuthClient() as any });
}

/** Vrátí Google People API klienta (v1) — pro kontakty. */
export function getPeopleClient(): people_v1.People {
  return google.people({ version: "v1", auth: loadAuthClient() as any });
}

/**
 * Invaliduje cache — donutí znovu načíst token ze souboru.
 * Užitečné po manuální obnově tokenu zvenčí.
 */
export function invalidateAuthCache(): void {
  _authClient = null;
}
