import type { GmailClient } from "@milo/tools";
import type { CommunicationProvider, Message, MessageChannel, MessagePriority } from "./types.js";

const AMOUNT_PATTERN = /\d{1,3}(?:[\s.]?\d{3})*\s*Kč/g;
const DATE_PATTERN = /\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/g;
const NON_REPLY_SENDER_PATTERN = /noreply|no-reply|newsletter|notification|mailer-daemon/i;
const PROMOTIONAL_LABELS = new Set(["CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_FORUMS"]);

export class GoogleGmailProvider implements CommunicationProvider {
  readonly name = "Gmail";
  readonly channel: MessageChannel = "gmail";
  readonly isConfigured = true;

  constructor(private client: GmailClient) {}

  async connect(): Promise<void> {
    // Connection is established by the caller via OAuth tokens.
  }

  async disconnect(): Promise<void> {
    // Tokens are managed by the caller.
  }

  async fetchMessages(limit = 50): Promise<Message[]> {
    const emails = await this.client.listEmails({ maxResults: limit });
    return emails.map((email) => {
      const isSpam = email.labels.includes("SPAM") || PROMOTIONAL_LABELS.has(email.labels.find((l) => PROMOTIONAL_LABELS.has(l)) ?? "");
      const isImportant = email.labels.includes("IMPORTANT");
      const priority: MessagePriority = isSpam ? "spam" : isImportant ? "important" : "normal";
      const text = `${email.subject} ${email.bodyText ?? email.snippet}`;
      const needsReply =
        !isSpam && email.isUnread && email.labels.includes("INBOX") && !NON_REPLY_SENDER_PATTERN.test(email.from);
      const senderName = email.from.replace(/<.*>/, "").trim().replace(/"/g, "") || email.from;
      const senderEmail = email.from.match(/<([^>]+)>/)?.[1] ?? email.from;

      const message: Message = {
        id: email.id,
        channel: "gmail",
        sender: { id: senderEmail, name: senderName || senderEmail, email: senderEmail },
        recipients: email.to.map((address) => ({ id: address, name: address, email: address })),
        subject: email.subject || "(Bez předmětu)",
        body: email.bodyText ?? email.snippet,
        priority,
        status: email.isUnread ? "unread" : "read",
        sentAt: email.date.toISOString(),
        receivedAt: email.date.toISOString(),
        threadId: email.threadId,
        attachments: [],
        extractedTasks: [],
        extractedDates: text.match(DATE_PATTERN) ?? [],
        extractedAmounts: text.match(AMOUNT_PATTERN) ?? [],
        tags: email.labels.filter((l) => !l.startsWith("CATEGORY_") && l !== "INBOX" && l !== "UNREAD" && l !== "IMPORTANT").map((l) => l.toLowerCase()),
        isSpam,
        needsReply,
      };
      return message;
    });
  }

  async sendMessage(): Promise<Message> {
    throw new Error("Odesílání zpráv zatím není podporováno – Gmail integrace je pouze pro čtení.");
  }

  async markAsRead(): Promise<void> {
    throw new Error("Označování zpráv jako přečtené zatím není podporováno – Gmail integrace je pouze pro čtení.");
  }

  async archive(): Promise<void> {
    throw new Error("Archivace zpráv zatím není podporována – Gmail integrace je pouze pro čtení.");
  }
}
