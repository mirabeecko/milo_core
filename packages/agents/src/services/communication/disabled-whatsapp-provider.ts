import type {
  CommunicationProvider,
  Message,
  MessageChannel,
} from "./types.js";

const _disabledError = (action: string): Error =>
  new Error(
    `WhatsApp: ${action} — WhatsApp provider není nakonfigurován. ` +
    `Nastav env COMMUNICATION_WHATSAPP_MODE na hodnotu "kapso", "meta", "twilio", nebo "mock" pro demo režim. ` +
    `Aktuální režim: disabled.`
  );

export class DisabledWhatsAppProvider implements CommunicationProvider {
  readonly name = "WhatsApp (Disabled)";
  readonly channel: MessageChannel = "whatsapp";
  readonly isConfigured = false;

  async connect(): Promise<void> {
    // No-op — provider is disabled
  }

  async disconnect(): Promise<void> {
    // No-op
  }

  async fetchMessages(): Promise<Message[]> {
    return [];
  }

  async sendMessage(_message: Omit<Message, "id" | "receivedAt" | "status">): Promise<Message> {
    throw _disabledError("sendMessage");
  }

  async markAsRead(_id: string): Promise<void> {
    throw _disabledError("markAsRead");
  }

  async archive(_id: string): Promise<void> {
    throw _disabledError("archive");
  }
}
