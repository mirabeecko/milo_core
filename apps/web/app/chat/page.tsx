"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Send, Sparkles, User, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useTtsStore } from "@/stores/tts-store";
import { sendMessage } from "@/lib/api/chat.api";
import { chatSuggestions, initialChatMessages } from "@/lib/mocks/chat";
import { formatRelative } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ChatPage(): JSX.Element {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContent />
    </Suspense>
  );
}

function ChatSkeleton(): JSX.Element {
  return (
    <DashboardLayout>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Card className="flex-1" />
      </div>
    </DashboardLayout>
  );
}

function ChatContent(): JSX.Element {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");

  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak } = useTtsStore();

  useEffect(() => {
    if (initialPrompt) {
      void handleSend(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleSend = async (text?: string): Promise<void> => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await sendMessage({ message: messageText });
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Odpověď se nepodařila odeslat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    void handleSend();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Chat</h2>
            <p className="text-sm text-muted-foreground">Zeptej se MiLO na cokoli.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Nový chat
          </Button>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
                <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                  <Bot className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Jsem MiLO</h3>
                  <p className="text-sm text-muted-foreground">
                    Co pro tebe mohu udělat? Vyber si příklad nebo napiš vlastní dotaz.
                  </p>
                </div>
                <div className="flex max-w-lg flex-wrap justify-center gap-2">
                  {chatSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSend(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && <LoadingBubble />}
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div ref={scrollRef} />
              </>
            )}
          </CardContent>

          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Napiš zprávu..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                Poslat
              </Button>
            </form>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              MiLO zatím používá demo režim. Backend API zpracovává zprávy lokálně.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function MessageBubble({ message }: { message: ChatMessage }): JSX.Element {
  const isAssistant = message.role === "assistant";
  const { speak } = useTtsStore();

  return (
    <div className={cn("flex w-full gap-3", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isAssistant
            ? "rounded-tl-none border border-border bg-card"
            : "rounded-tr-none bg-primary text-primary-foreground",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        <div
          className={cn(
            "mt-2 flex items-center gap-2 text-xs",
            isAssistant ? "text-muted-foreground" : "text-primary-foreground/70",
          )}
        >
          <span>{formatRelative(message.timestamp)}</span>
          {isAssistant && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => speak(message.content)}
              title="Přehrát odpověď"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {!isAssistant && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function LoadingBubble(): JSX.Element {
  return (
    <div className="flex w-full gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-none border border-border bg-card px-4 py-3">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-3" />
        </div>
      </div>
    </div>
  );
}
