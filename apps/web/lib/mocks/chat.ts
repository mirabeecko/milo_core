export function generateMockReply(_message: string): string {
  return "Data nejsou k dispozici — připojte AI provider pro chat.";
}

export const chatSuggestions: string[] = [];

export const initialChatMessages: Array<{
  id: string;
  role: string;
  content: string;
  timestamp: string;
}> = [];
