import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChatConversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: unknown;
  suggested_actions?: unknown;
  mission_id?: string;
  created_at: string;
}

export class ChatsRepo {
  constructor(private supabase: SupabaseClient) {}

  async createConversation(userId: string, title?: string): Promise<ChatConversation> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .insert({ user_id: userId, title })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async addMessage(msg: Omit<ChatMessageRecord, "id" | "created_at">): Promise<ChatMessageRecord> {
    const { data, error } = await this.supabase.from("chat_messages").insert(msg).select().single();
    if (error) throw error;
    return data;
  }

  async getMessages(conversationId: string, limit = 50): Promise<ChatMessageRecord[]> {
    const { data } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);
    return data ?? [];
  }

  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    const { data } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    return data ?? [];
  }
}
