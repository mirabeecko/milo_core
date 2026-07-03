import { google, gmail_v1 } from "googleapis";
import { EmailMessage, ListEmailsOptions } from "./types.js";

export interface GmailClientConfig {
  accessToken: string;
  refreshToken?: string;
}

export class GmailClient {
  private gmail;

  constructor(config: GmailClientConfig) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    this.gmail = google.gmail({ version: "v1", auth });
  }

  async listEmails(options: ListEmailsOptions = {}): Promise<EmailMessage[]> {
    const response = await this.gmail.users.messages.list({
      userId: "me",
      maxResults: options.maxResults ?? 20,
      labelIds: options.labelIds,
      q: options.query,
    });

    const messages = response.data.messages ?? [];
    const emails: EmailMessage[] = [];

    for (const message of messages) {
      if (!message.id) continue;

      const detail = await this.gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      emails.push(this.parseMessage(detail.data as gmail_v1.Schema$Message));
    }

    return emails;
  }

  async getEmail(id: string): Promise<EmailMessage> {
    const response = await this.gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    return this.parseMessage(response.data as gmail_v1.Schema$Message);
  }

  private parseMessage(data: gmail_v1.Schema$Message): EmailMessage {
    const payload = data.payload ?? null;
    const headers = payload?.headers ?? [];

    const getHeader = (name: string): string => {
      const header = headers.find(
        (h) => h.name?.toLowerCase() === name.toLowerCase(),
      );
      return header?.value ?? "";
    };

    const parseAddresses = (value: string): string[] =>
      value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

    const { text, html } = this.extractBodies(payload);

    return {
      id: data.id ?? "",
      threadId: data.threadId ?? "",
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: parseAddresses(getHeader("To")),
      date: new Date(getHeader("Date")),
      snippet: data.snippet ?? "",
      bodyText: text,
      bodyHtml: html,
      labels: data.labelIds ?? [],
      isUnread: data.labelIds?.includes("UNREAD") ?? false,
    };
  }

  private extractBodies(payload: gmail_v1.Schema$MessagePart | null): {
    text: string | null;
    html: string | null;
  } {
    let text: string | null = null;
    let html: string | null = null;

    const decodeBase64 = (data?: string | null): string => {
      if (!data) return "";
      const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(normalized, "base64").toString("utf-8");
    };

    const walkParts = (parts?: gmail_v1.Schema$MessagePart[] | null): void => {
      if (!parts) return;

      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data && !text) {
          text = decodeBase64(part.body.data);
        }
        if (part.mimeType === "text/html" && part.body?.data && !html) {
          html = decodeBase64(part.body.data);
        }
        if (part.parts) {
          walkParts(part.parts);
        }
      }
    };

    if (payload?.mimeType === "text/plain" && payload.body?.data) {
      text = decodeBase64(payload.body.data);
    } else if (payload?.mimeType === "text/html" && payload.body?.data) {
      html = decodeBase64(payload.body.data);
    } else if (payload?.parts) {
      walkParts(payload.parts);
    }

    return { text, html };
  }
}
