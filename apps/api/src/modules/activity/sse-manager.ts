/**
 * SSE Manager — Server-Sent Events pro real-time aktivitu agentů.
 *
 * Umožňuje dashboardu přijímat živý stream událostí:
 * - agent:started, agent:thinking, agent:tool_call, agent:tool_result
 * - agent:completed, agent:error
 * - hermes:tool_call, hermes:tool_result
 */

import type { FastifyReply } from "fastify";

// Inline — vyhneme se importu z @milo/agents (ještě není v package exports)
export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: "agent:started" | "agent:thinking" | "agent:tool_call" | "agent:tool_result" | "agent:completed" | "agent:error" | "hermes:tool_call" | "hermes:tool_result";
  message: string;
  toolName?: string;
  toolResult?: unknown;
  error?: string;
}

interface SSEClient {
  id: string;
  reply: FastifyReply;
  createdAt: Date;
}

export class SSEManager {
  private static instance: SSEManager;
  private clients = new Map<string, SSEClient>();

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  /** Registrace nového SSE klienta (dashboard) */
  register(reply: FastifyReply): string {
    const id = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Úvodní heartbeat
    reply.raw.write(`data: ${JSON.stringify({ type: "connected", clientId: id })}\n\n`);

    this.clients.set(id, { id, reply, createdAt: new Date() });

    // Cleanup při odpojení
    reply.raw.on("close", () => {
      this.clients.delete(id);
    });

    return id;
  }

  /** Broadcast události všem připojeným klientům */
  broadcast(event: ActivityEvent): void {
    const data = JSON.stringify(event);
    for (const [id, client] of this.clients) {
      try {
        client.reply.raw.write(`data: ${data}\n\n`);
      } catch {
        // Klient se odpojil — odstraníme
        this.clients.delete(id);
      }
    }
  }

  /** Počet připojených klientů */
  get connectedCount(): number {
    return this.clients.size;
  }

  /** Odpojení všech klientů */
  disconnectAll(): void {
    for (const [id, client] of this.clients) {
      try {
        client.reply.raw.end();
      } catch {
        // ignore
      }
      this.clients.delete(id);
    }
  }
}
