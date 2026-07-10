"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/lib/api/chat.api";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ahoj! Jsem MiLO. Jak ti můžu pomoct?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const reply = await sendMessage({ message: text });
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Omlouvám se, něco se pokazilo. Zkus to prosím znovu.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.role === "user" && "justify-end")}
          >
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <Card className={cn(
              "max-w-[80%] px-4 py-3",
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card",
            )}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="mt-1 text-xs opacity-60">
                {new Date(msg.timestamp).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </Card>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="border-t border-border p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napiš zprávu..."
            className="flex-1"
            disabled={isSending}
          />
          <Button type="submit" disabled={!input.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
