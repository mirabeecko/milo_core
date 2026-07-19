import { apiClient } from "./client";
import type { ChatMessage } from "@/lib/types";

export interface ChatApiResponse {
  message: ChatMessage;
  missionId?: string;
  conversationId?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export async function sendMessage(request: ChatRequest): Promise<ChatApiResponse> {
  try {
    const response = await apiClient<ChatApiResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response;
  } catch {
    return {
      message: {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "Chat API není dostupné — zkontrolujte připojení k serveru.",
        timestamp: new Date().toISOString(),
        sources: [],
        suggestedActions: [],
      },
    };
  }
}
