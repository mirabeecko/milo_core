"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type:
    | "agent:started"
    | "agent:thinking"
    | "agent:tool_call"
    | "agent:tool_result"
    | "agent:completed"
    | "agent:error"
    | "hermes:tool_call"
    | "hermes:tool_result";
  message: string;
  toolName?: string;
  toolResult?: unknown;
  error?: string;
}

interface UseActivityStreamOptions {
  endpoint?: string;
  maxEvents?: number;
}

export function useActivityStream(opts: UseActivityStreamOptions = {}) {
  const { endpoint = "http://localhost:4001/api/activity/stream", maxEvents = 200 } = opts;
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(endpoint);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if ((data as ActivityEvent)?.type === "connected") return;
        setEvents((prev) => {
          const next = [...prev, data];
          return next.length > maxEvents ? next.slice(-maxEvents) : next;
        });
      } catch {
        // ignore parse errors
      }
    };

    return es;
  }, [endpoint, maxEvents]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  const clear = useCallback(() => setEvents([]), []);

  useEffect(() => {
    const es = connect();
    return () => {
      es.close();
      setConnected(false);
    };
  }, [connect]);

  return { events, connected, disconnect, clear, reconnect: connect };
}
