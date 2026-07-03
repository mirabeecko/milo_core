import type {
  CommunicationProvider,
  CommunicationService,
  CommunicationStats,
  Contact,
  ContactRef,
  DraftReply,
  Message,
  MessageChannel,
  MessagePriority,
  MessageStatus,
  MessageSummary,
  Thread,
} from "./types.js";

export class DefaultCommunicationService implements CommunicationService {
  private messages: Message[] = [];
  private drafts: DraftReply[] = [];
  private summaries = new Map<string, MessageSummary>();
  private lastSyncedAt?: string;

  constructor(private providers: CommunicationProvider[]) {}

  getProviders(): CommunicationProvider[] {
    return this.providers;
  }

  async sync(): Promise<void> {
    const results = await Promise.all(this.providers.map((p) => p.fetchMessages(50)));
    this.messages = results.flat().sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    this.lastSyncedAt = new Date().toISOString();
  }

  async getMessages(options?: {
    status?: MessageStatus;
    priority?: MessagePriority;
    channel?: MessageChannel;
    limit?: number;
  }): Promise<Message[]> {
    let filtered = [...this.messages];
    if (options?.status) filtered = filtered.filter((m) => m.status === options.status);
    if (options?.priority) filtered = filtered.filter((m) => m.priority === options.priority);
    if (options?.channel) filtered = filtered.filter((m) => m.channel === options.channel);
    if (options?.limit) filtered = filtered.slice(0, options.limit);
    return filtered;
  }

  async getThreads(limit = 20): Promise<Thread[]> {
    const grouped = new Map<string, Message[]>();
    for (const message of this.messages) {
      const key = message.threadId ?? message.id;
      const existing = grouped.get(key) ?? [];
      existing.push(message);
      grouped.set(key, existing);
    }

    const threads: Thread[] = Array.from(grouped.entries()).map(([id, messages]) => {
      const sorted = messages.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
      const last = sorted[sorted.length - 1];
      const priorities: MessagePriority[] = ["critical", "important", "normal", "low", "spam"];
      const priority = priorities.find((p) => sorted.some((m) => m.priority === p)) ?? "normal";
      return {
        id,
        subject: last.subject,
        channel: last.channel,
        participants: collectParticipants(sorted),
        messages: sorted,
        lastMessageAt: last.receivedAt,
        priority,
        summary: this.summaries.get(id)?.summary,
        needsReply: sorted.some((m) => m.needsReply && m.status !== "replied"),
        replyDueAt: last.replyDueAt,
      };
    });

    return threads.slice(0, limit);
  }

  async getContacts(): Promise<Contact[]> {
    const bySender = new Map<string, Message[]>();
    for (const message of this.messages) {
      if (message.isSpam) continue;
      const key = message.sender.id;
      const existing = bySender.get(key) ?? [];
      existing.push(message);
      bySender.set(key, existing);
    }

    return Array.from(bySender.entries()).map(([id, messages]) => buildContact(id, messages));
  }

  async getContact(id: string): Promise<Contact | null> {
    const messages = this.messages.filter((m) => m.sender.id === id || m.recipients.some((r) => r.id === id));
    if (messages.length === 0) return null;
    return buildContact(id, messages);
  }

  async summarizeMessage(messageId: string): Promise<MessageSummary> {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) throw new Error(`Message ${messageId} not found`);
    const summary = generateSummary(message);
    this.summaries.set(messageId, summary);
    return summary;
  }

  async summarizeThread(threadId: string): Promise<MessageSummary> {
    const threadMessages = this.messages.filter((m) => m.threadId === threadId || m.id === threadId);
    if (threadMessages.length === 0) throw new Error(`Thread ${threadId} not found`);
    const combined = threadMessages.map((m) => `${m.sender.name}: ${m.body}`).join("\n");
    const summary = generateSummaryFromText(combined, threadMessages[0]?.subject ?? "Konverzace");
    this.summaries.set(threadId, summary);
    return summary;
  }

  async generateDraftReplies(messageId: string): Promise<DraftReply[]> {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) throw new Error(`Message ${messageId} not found`);

    const replies: DraftReply[] = [
      {
        id: `draft-${messageId}-short`,
        messageId,
        tone: "short",
        content: generateShortReply(message),
        generatedAt: new Date().toISOString(),
      },
      {
        id: `draft-${messageId}-formal`,
        messageId,
        tone: "formal",
        content: generateFormalReply(message),
        generatedAt: new Date().toISOString(),
      },
      {
        id: `draft-${messageId}-friendly`,
        messageId,
        tone: "friendly",
        content: generateFriendlyReply(message),
        generatedAt: new Date().toISOString(),
      },
    ];

    if (message.tags.some((t) => t.includes("právo") || t.includes("soud") || t.includes("lhůta"))) {
      replies.push({
        id: `draft-${messageId}-legal`,
        messageId,
        tone: "legal",
        content: generateLegalReply(message),
        generatedAt: new Date().toISOString(),
      });
    }

    if (message.extractedAmounts.length > 0 || message.tags.some((t) => t.includes("nabídka") || t.includes("faktura"))) {
      replies.push({
        id: `draft-${messageId}-business`,
        messageId,
        tone: "business",
        content: generateBusinessReply(message),
        generatedAt: new Date().toISOString(),
      });
    }

    this.drafts = [...this.drafts.filter((d) => d.messageId !== messageId), ...replies];
    return replies;
  }

  async getDrafts(): Promise<DraftReply[]> {
    return this.drafts;
  }

  async getWaitingForReply(limit = 10): Promise<Message[]> {
    return this.messages
      .filter((m) => m.needsReply && m.status !== "replied" && m.status !== "archived" && !m.isSpam)
      .sort((a, b) => {
        const aDue = a.replyDueAt ? new Date(a.replyDueAt).getTime() : Infinity;
        const bDue = b.replyDueAt ? new Date(b.replyDueAt).getTime() : Infinity;
        return aDue - bDue;
      })
      .slice(0, limit);
  }

  async getStatistics(): Promise<CommunicationStats> {
    const unread = this.messages.filter((m) => m.status === "unread" && !m.isSpam).length;
    const waiting = this.messages.filter((m) => m.needsReply && m.status !== "replied" && !m.isSpam).length;
    const spam = this.messages.filter((m) => m.isSpam).length;
    const repliedToday = this.messages.filter((m) => m.status === "replied" && isToday(m.receivedAt)).length;
    return {
      newMessages: unread,
      unreadMessages: unread,
      waitingForReply: waiting,
      drafts: this.drafts.length,
      spam,
      repliedToday,
      aiSuggestionsGenerated: this.drafts.length,
    };
  }

  getLastSyncedAt(): string | undefined {
    return this.lastSyncedAt;
  }
}

function collectParticipants(messages: Message[]): ContactRef[] {
  const map = new Map<string, ContactRef>();
  for (const message of messages) {
    map.set(message.sender.id, message.sender);
    for (const recipient of message.recipients) {
      map.set(recipient.id, recipient);
    }
  }
  return Array.from(map.values());
}

function buildContact(id: string, messages: Message[]): Contact {
  const sorted = messages.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  const last = sorted[0];
  const projects = Array.from(new Set(messages.flatMap((m) => inferProjects(m))));
  const recentTopics = Array.from(new Set(messages.flatMap((m) => m.tags))).slice(0, 5);
  const openCommitments = messages
    .filter((m) => m.needsReply && m.status !== "replied")
    .map((m) => `Odpovědět: ${m.subject}`);
  const legalCount = messages.filter((m) => m.tags.some((t) => t.includes("právo") || t.includes("soud"))).length;
  const businessCount = messages.filter((m) => m.extractedAmounts.length > 0).length;

  let recommendedTone: Contact["recommendedTone"] = "friendly";
  if (legalCount > 0) recommendedTone = "legal";
  else if (businessCount > 0) recommendedTone = "business";
  else if (last?.sender.email?.includes("soud") || last?.sender.name.toLowerCase().includes("soud")) recommendedTone = "formal";

  const escalationRisk: Contact["escalationRisk"] =
    messages.filter((m) => m.priority === "critical" && m.needsReply).length > 0
      ? "high"
      : messages.filter((m) => m.priority === "important" && m.needsReply).length > 0
        ? "medium"
        : "low";

  return {
    id,
    name: last.sender.name,
    email: last.sender.email,
    phone: last.sender.phone,
    avatarUrl: last.sender.avatarUrl,
    projects,
    lastContactAt: last.receivedAt,
    openTasks: messages.filter((m) => m.needsReply && m.status !== "replied").length,
    recentTopics,
    openCommitments,
    recommendedTone,
    escalationRisk,
    totalMessages: messages.length,
    averageResponseTimeHours: 4,
  };
}

function inferProjects(message: Message): string[] {
  const projects: string[] = [];
  const text = `${message.subject} ${message.body} ${message.tags.join(" ")}`.toLowerCase();
  if (text.includes("tj krupka") || text.includes("soud") || text.includes("lhůta")) projects.push("TJ Krupka");
  if (text.includes("milo")) projects.push("MiLO_Core");
  if (text.includes("komárka")) projects.push("Komárka");
  if (text.includes("ninja")) projects.push("Ninja Týden");
  return projects;
}

function generateSummary(message: Message): MessageSummary {
  return generateSummaryFromText(message.body, message.subject);
}

function generateSummaryFromText(text: string, subject: string): MessageSummary {
  const lower = text.toLowerCase();
  const requests: string[] = [];
  const deadlines: string[] = [];
  const tasks: string[] = [];
  const amounts: string[] = [];

  if (lower.includes("potvrď") || lower.includes("potvrzení")) requests.push("Potvrdit termín nebo skutečnost");
  if (lower.includes("zašli") || lower.includes("pošli") || lower.includes("poslat")) requests.push("Zaslat dokument nebo informaci");
  if (lower.includes("nabídk")) requests.push("Připravit nebo poslat nabídku");
  if (lower.includes("faktur")) requests.push("Zpracovat fakturu");

  const dateMatches = text.match(/\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/g);
  if (dateMatches) deadlines.push(...dateMatches);
  if (lower.includes("zítra")) deadlines.push("zítra");
  if (lower.includes("příští týden")) deadlines.push("příští týden");

  const amountMatches = text.match(/\d{1,3}(?:\s?\d{3})*\s*Kč/g);
  if (amountMatches) amounts.push(...amountMatches);

  if (requests.length === 0 && deadlines.length === 0) tasks.push("Přečíst a vyhodnotit");

  let sentiment: MessageSummary["sentiment"] = "neutral";
  if (lower.includes("urgent") || lower.includes("okamžitě") || lower.includes("kritick")) sentiment = "urgent";
  else if (lower.includes("děkuji") || lower.includes("super") || lower.includes("skvěl")) sentiment = "positive";
  else if (lower.includes("stížnost") || lower.includes("chyba") || lower.includes("nesouhlas")) sentiment = "negative";

  return {
    summary: `Zpráva „${subject}" obsahuje ${requests.length > 0 ? "požadavky" : "informace"} týkající se ${deadlines.length > 0 ? "termínů" : "běžné komunikace"}.`,
    keyPoints: [subject, ...requests.slice(0, 2)],
    requests,
    deadlines,
    tasks: tasks.length > 0 ? tasks : requests,
    contacts: [],
    amounts,
    suggestedNextSteps: requests.length > 0 ? [requests[0], "Připravit odpověď"] : ["Přečíst a archivovat"],
    sentiment,
  };
}

function generateShortReply(_message: Message): string {
  return `Dobrý den,\n\nděkuji za zprávu. V nejbližší době se jí budu věnovat.\n\nS pozdravem`;
}

function generateFormalReply(message: Message): string {
  return `Vážený/á ${message.sender.name},\n\nděkuji za Vaši zprávu. Prostuduji ji a co nejdříve se Vám ozvu s reakcí.\n\nS úctou`;
}

function generateFriendlyReply(message: Message): string {
  return `Ahoj ${message.sender.name.split(" ")[0]},\n\ndíky za info. Mrknu na to a dám vědět.\n\nMěj se`;
}

function generateLegalReply(message: Message): string {
  return `Vážený/á ${message.sender.name},\n\npřijali jsme Vaši listinu. Provedeme právní analýzu a ve stanovené lhůtě podáme reakci.\n\nS pozdravem`;
}

function generateBusinessReply(message: Message): string {
  const amounts = message.extractedAmounts.length > 0 ? ` (zmíněné částky: ${message.extractedAmounts.join(", ")})` : "";
  return `Dobrý den ${message.sender.name},\n\nděkuji za zprávu${amounts}. Zpracuji požadované informace a obrátím se na Vás s návrhem dalšího postupu.\n\nS pozdravem`;
}

function isToday(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
