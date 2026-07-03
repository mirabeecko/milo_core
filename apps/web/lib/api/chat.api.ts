import { apiClient, useMockData } from "./client";
import type { ChatMessage } from "@/lib/types";
import { generateMockReply } from "@/lib/mocks/chat";

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
    await simulateLatency();
    return {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: generateMockReply(request.message),
      timestamp: new Date().toISOString(),
      sources: [],
      suggestedActions: [
        "Co dnes musím řešit?",
        "Najdi dokumenty ke kauze TJ Krupka.",
        "Co udělali agenti?",
      ],
    };
  }

  const response = await apiClient<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return response.message;
}

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 800));
}
