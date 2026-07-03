export type MessageChannel = "gmail" | "whatsapp" | "telegram" | "teams" | "slack" | "isds" | "sms";
export type MessagePriority = "critical" | "important" | "normal" | "low" | "spam";
export type MessageStatus = "unread" | "read" | "replied" | "archived" | "snoozed";

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
}

export interface Message {
  id: string;
  channel: MessageChannel;
  sender: ContactRef;
  recipients: ContactRef[];
  subject: string;
  body: string;
  summary?: string;
  priority: MessagePriority;
  status: MessageStatus;
  sentAt: string;
  receivedAt: string;
  threadId?: string;
  attachments: MessageAttachment[];
  extractedTasks: string[];
  extractedDates: string[];
  extractedAmounts: string[];
  tags: string[];
  isSpam: boolean;
  needsReply: boolean;
  replyDueAt?: string;
}

export interface ContactRef {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  company?: string;
  projects: string[];
  lastContactAt?: string;
  openTasks: number;
  recentTopics: string[];
  openCommitments: string[];
  recommendedTone: "formal" | "friendly" | "legal" | "business" | "casual";
  escalationRisk: "high" | "medium" | "low";
  totalMessages: number;
  averageResponseTimeHours?: number;
}

export interface Thread {
  id: string;
  subject: string;
  channel: MessageChannel;
  participants: ContactRef[];
  messages: Message[];
  lastMessageAt: string;
  priority: MessagePriority;
  summary?: string;
  needsReply: boolean;
  replyDueAt?: string;
}

export interface MessageSummary {
  summary: string;
  keyPoints: string[];
  requests: string[];
  deadlines: string[];
  tasks: string[];
  contacts: string[];
  amounts: string[];
  suggestedNextSteps: string[];
  sentiment: "positive" | "neutral" | "negative" | "urgent";
}

export interface DraftReply {
  id: string;
  messageId: string;
  tone: "short" | "formal" | "friendly" | "legal" | "business";
  content: string;
  generatedAt: string;
}

export interface CommunicationStats {
  newMessages: number;
  unreadMessages: number;
  waitingForReply: number;
  drafts: number;
  spam: number;
  repliedToday: number;
  averageResponseTimeHours?: number;
  aiSuggestionsGenerated: number;
}

export interface CommunicationProvider {
  readonly name: string;
  readonly channel: MessageChannel;
  readonly isConfigured: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchMessages(limit?: number): Promise<Message[]>;
  sendMessage(message: Omit<Message, "id" | "receivedAt" | "status">): Promise<Message>;
  markAsRead(id: string): Promise<void>;
  archive(id: string): Promise<void>;
}

export interface CommunicationService {
  getProviders(): CommunicationProvider[];
  sync(): Promise<void>;
  getMessages(options?: { status?: MessageStatus; priority?: MessagePriority; channel?: MessageChannel; limit?: number }): Promise<Message[]>;
  getThreads(limit?: number): Promise<Thread[]>;
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | null>;
  summarizeMessage(messageId: string): Promise<MessageSummary>;
  summarizeThread(threadId: string): Promise<MessageSummary>;
  generateDraftReplies(messageId: string): Promise<DraftReply[]>;
  getDrafts(): Promise<DraftReply[]>;
  getWaitingForReply(limit?: number): Promise<Message[]>;
  getStatistics(): Promise<CommunicationStats>;
}
