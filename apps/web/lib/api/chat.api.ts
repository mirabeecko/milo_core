import { apiClient } from "./client";
import type { ChatMessage } from "@/lib/types";

export interface ChatResponse {
  message: ChatMessage;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export async function sendMessage(request: ChatRequest): Promise<ChatMessage> {
  try {
    const response = await apiClient<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.message;
  } catch {
    return {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: "Chat API není dostupné — zkontrolujte připojení k serveru.",
      timestamp: new Date().toISOString(),
      sources: [],
      suggestedActions: [],
    };
  }
}
