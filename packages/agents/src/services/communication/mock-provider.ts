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
    return [];
  }

  async sendMessage(message: Omit<Message, "id" | "receivedAt" | "status">): Promise<Message> {
    return { ...message, id: "mock-wa-new", receivedAt: new Date().toISOString(), status: "replied" };
  }

  async markAsRead(): Promise<void> {}
  async archive(): Promise<void> {}
}

