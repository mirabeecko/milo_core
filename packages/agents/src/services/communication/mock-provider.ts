import type {
  CommunicationProvider,
  Message,
  MessageChannel,
  MessagePriority,
  MessageStatus,
} from "./types.js";

export class MockGmailProvider implements CommunicationProvider {
  readonly name = "Mock Gmail";
  readonly channel: MessageChannel = "gmail";
  readonly isConfigured = true;

  private messages: Message[] = [];
  private nextId = 1;

  constructor() {
    this.messages = generateMockMessages();
    this.nextId = this.messages.length + 1;
  }

  async connect(): Promise<void> {
    // Mock provider is always connected
  }

  async disconnect(): Promise<void> {
    // No-op
  }

  async fetchMessages(limit = 50): Promise<Message[]> {
    return this.messages.slice(0, limit);
  }

  async sendMessage(message: Omit<Message, "id" | "receivedAt" | "status">): Promise<Message> {
    const created: Message = {
      ...message,
      id: `mock-msg-${this.nextId++}`,
      receivedAt: new Date().toISOString(),
      status: "replied",
    };
    this.messages.unshift(created);
    return created;
  }

  async markAsRead(id: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === id);
    if (msg) msg.status = "read";
  }

  async archive(id: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === id);
    if (msg) msg.status = "archived";
  }
}

export class MockWhatsAppProvider implements CommunicationProvider {
  readonly name = "Mock WhatsApp";
  readonly channel: MessageChannel = "whatsapp";
  readonly isConfigured = true;

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async fetchMessages(): Promise<Message[]> {
    return [
      createMessage({
        id: "mock-wa-1",
        channel: "whatsapp",
        sender: { id: "c-pavel", name: "Pavel Novák", phone: "+420123456789" },
        subject: "Rychlá domluva",
        body: "Ahoj, můžeme se sejít zítra v 10? Potřebuju probrat ten rozpočet.",
        priority: "important",
        status: "unread",
        sentAt: hoursAgo(2),
        needsReply: true,
        tags: ["schůzka", "rozpočet"],
      }),
    ];
  }

  async sendMessage(message: Omit<Message, "id" | "receivedAt" | "status">): Promise<Message> {
    return { ...message, id: "mock-wa-new", receivedAt: new Date().toISOString(), status: "replied" };
  }

  async markAsRead(): Promise<void> {}
  async archive(): Promise<void> {}
}

function generateMockMessages(): Message[] {
  return [
    createMessage({
      id: "mock-msg-1",
      channel: "gmail",
      sender: { id: "c-klient", name: "Jan Klient", email: "klient@example.com" },
      subject: "Schůzka a nabídka",
      body: "Dobrý den, posílám upřesnění k naší schůzce. Termín je příští úterý v 14:00. Prosím o potvrzení a zaslání nabídky do 50 000 Kč.",
      priority: "important",
      status: "unread",
      sentAt: hoursAgo(1),
      needsReply: true,
      replyDueAt: hoursFromNow(24),
      extractedTasks: ["potvrdit termín", "poslat nabídku"],
      extractedDates: ["příští úterý 14:00"],
      extractedAmounts: ["50 000 Kč"],
      tags: ["nabídka", "schůzka"],
    }),
    createMessage({
      id: "mock-msg-2",
      channel: "gmail",
      sender: { id: "c-soud", name: "Krajský soud", email: "podatelna@soud.cz" },
      subject: "Doručenka - přípis ve věci TJ Krupka",
      body: "Byla Vám doručena listina. Lhůta pro reakci je do 15. 7. 2026. Příloha obsahuje vyrozumění.",
      priority: "critical",
      status: "unread",
      sentAt: hoursAgo(3),
      needsReply: true,
      replyDueAt: daysFromNow(10),
      extractedTasks: ["přečíst přípis", "připravit reakci"],
      extractedDates: ["15. 7. 2026"],
      tags: ["soud", "lhůta", "právo"],
    }),
    createMessage({
      id: "mock-msg-3",
      channel: "gmail",
      sender: { id: "c-tym", name: "Tým MiLO", email: "tym@milo.ai" },
      subject: "Denní sync",
      body: "Ahoj, dneska ve 14:00 standup. Máme probrat postup u Communication Agenta.",
      priority: "normal",
      status: "read",
      sentAt: hoursAgo(5),
      needsReply: false,
      tags: ["standup", "vývoj"],
    }),
    createMessage({
      id: "mock-msg-4",
      channel: "gmail",
      sender: { id: "c-newsletter", name: "Newsletter", email: "news@example.com" },
      subject: "Týdenní novinky",
      body: "Přečtěte si novinky ze světa technologií...",
      priority: "low",
      status: "read",
      sentAt: hoursAgo(12),
      needsReply: false,
      isSpam: true,
      tags: ["newsletter"],
    }),
    createMessage({
      id: "mock-msg-5",
      channel: "gmail",
      sender: { id: "c-obchod", name: "Obchodní oddělení", email: "obchod@partner.cz" },
      subject: "Faktura 2026/045",
      body: "Dobrý den, zasíláme fakturu č. 2026/045 ve výši 12 500 Kč se splatností 14. 7. 2026.",
      priority: "important",
      status: "unread",
      sentAt: hoursAgo(8),
      needsReply: false,
      extractedAmounts: ["12 500 Kč"],
      extractedDates: ["14. 7. 2026"],
      tags: ["faktura", "finance"],
    }),
  ];
}

interface CreateMessageOptions {
  id: string;
  channel: MessageChannel;
  sender: { id: string; name: string; email?: string; phone?: string };
  subject: string;
  body: string;
  priority: MessagePriority;
  status: MessageStatus;
  sentAt: string;
  needsReply: boolean;
  replyDueAt?: string;
  extractedTasks?: string[];
  extractedDates?: string[];
  extractedAmounts?: string[];
  tags?: string[];
  isSpam?: boolean;
}

function createMessage(options: CreateMessageOptions): Message {
  return {
    ...options,
    recipients: [{ id: "user", name: "Uživatel" }],
    receivedAt: options.sentAt,
    summary: undefined,
    attachments: [],
    extractedTasks: options.extractedTasks ?? [],
    extractedDates: options.extractedDates ?? [],
    extractedAmounts: options.extractedAmounts ?? [],
    tags: options.tags ?? [],
    isSpam: options.isSpam ?? false,
  };
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function hoursFromNow(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
