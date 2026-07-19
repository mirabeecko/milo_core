import type { AgentManager } from "@milo/agents";
import type { AiMessage, ModelRouter } from "@milo/ai";
import { CommandProcessor } from "./command-processor.js";
import type { ChatMessage, ChatRequest, ChatResponse } from "./types.js";

const MAX_HISTORY_LENGTH = 20;

export class ChatService {
  private processor: CommandProcessor;
  private conversations = new Map<string, AiMessage[]>();

  constructor(manager?: AgentManager, modelRouter?: ModelRouter) {
    this.processor = new CommandProcessor(manager, modelRouter);
  }

  async sendMessage(
    _userId: string,
    request: ChatRequest,
    _conversationId?: string,
  ): Promise<ChatResponse> {
    const convId = request.conversationId ?? _conversationId ?? `conv-${Date.now()}`;
    const history = this.conversations.get(convId) ?? [];

    history.push({ role: "user", content: request.message });

    const result = await this.processor.process(request.message, history);

    history.push({ role: "assistant", content: result.text });

    if (history.length > MAX_HISTORY_LENGTH * 2) {
      const trimmed = history.slice(-MAX_HISTORY_LENGTH * 2);
      this.conversations.set(convId, trimmed);
    } else {
      this.conversations.set(convId, history);
    }

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
      conversationId: convId,
      demo: false,
      missionId: result.missionId,
    };
  }
}
