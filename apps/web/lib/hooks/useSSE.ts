"use client";

import { useEffect, useRef, useCallback } from "react";

export interface SseEvent {
  type: string;
  agentId?: string;
  missionId?: string;
  timestamp?: string;
  payload: Record<string, unknown>;
}

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;

export function useSSE(
  onEvent: (event: SseEvent) => void,
  options?: { enabled?: boolean },
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("milo:accessToken") ?? "demo-token"
        : "demo-token";

    const es = new EventSource(
      `/api/events/stream?token=${encodeURIComponent(token)}`,
    );

    es.onopen = () => {
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    };

    es.onmessage = (evt: MessageEvent) => {
      try {
        const event: SseEvent = JSON.parse(evt.data as string);
        if (event.type === "connection") return;
        onEventRef.current(event);
      } catch { /* ignore malformed events */ }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY,
        );
      }, reconnectDelayRef.current);
    };

    eventSourceRef.current = es;
  }, []);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
  }, []);

  useEffect(() => {
    if (options?.enabled === false) return;

    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect, options?.enabled]);

  return { disconnect };
}
