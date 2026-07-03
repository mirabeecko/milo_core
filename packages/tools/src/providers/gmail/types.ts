export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  date: Date;
  snippet: string;
  bodyText: string | null;
  bodyHtml: string | null;
  labels: string[];
  isUnread: boolean;
}

export interface ListEmailsOptions {
  maxResults?: number;
  labelIds?: string[];
  query?: string;
}
