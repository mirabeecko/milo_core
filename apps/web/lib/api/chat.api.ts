import { apiClient, useMockData } from "./client";
import type { ChatMessage } from "@/lib/types";

export interface ChatResponse {
  message: ChatMessage;
  demo?: boolean;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export async function sendMessage(request: ChatRequest): Promise<ChatMessage> {
  if (useMockData) {
    return {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: "AI chat není k dispozici — připojte OpenAI nebo Ollama provider.",
      timestamp: new Date().toISOString(),
      sources: [],
      suggestedActions: [],
    };
  }

  const response = await apiClient<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return response.message;
}
