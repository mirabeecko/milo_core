import type { AgentManager } from "@milo/agents";
import { CommandProcessor } from "./command-processor.js";
import type { ChatMessage, ChatRequest, ChatResponse } from "./types.js";

export class ChatService {
  private processor: CommandProcessor;

  constructor(manager?: AgentManager) {
    this.processor = new CommandProcessor(manager);
  }

  async sendMessage(
    _userId: string,
    request: ChatRequest,
    _conversationId?: string,
  ): Promise<ChatResponse> {
    const result = await this.processor.process(request.message);

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: result.text,
      timestamp: new Date().toISOString(),
      sources: result.sources,
      suggestedActions: result.suggestedActions,
    };

    return {
      message,
      demo: false,
      missionId: result.missionId,
    };
  }
}
