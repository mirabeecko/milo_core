import { type ChildProcess, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type { ReadLine } from "node:readline";

export interface McpServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface McpTool {
  serverName: string;
  toolName: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

type JsonRpcNotification = Omit<JsonRpcRequest, "id">;

type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

type TransportSend = (method: string, params?: Record<string, unknown>) => Promise<unknown>;

/** Default timeout for MCP HTTP requests (60s) */
const MCP_HTTP_TIMEOUT_MS = 60_000;
/** Default timeout for SSE stream read loop (5min — covers long-running server pushes) */
const MCP_SSE_READ_TIMEOUT_MS = 300_000;

export class McpClient {
  public readonly config: McpServerConfig;
  private process: ChildProcess | null = null;
  private rl: ReadLine | null = null;
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private connected = false;
  private serverCapabilities: Record<string, unknown> | null = null;
  private serverVersion: Record<string, unknown> | null = null;
  private disposable: Array<() => void> = [];
  private transportSend: TransportSend | null = null;
  /** HTTP request timeout config (overridable via env or constructor in the future) */
  private httpTimeoutMs: number;

  constructor(serverConfig: McpServerConfig) {
    this.config = serverConfig;
    this.httpTimeoutMs = MCP_HTTP_TIMEOUT_MS;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    if (this.config.url) {
      this.transportSend = await this.connectHttp();
    } else if (this.config.command) {
      this.transportSend = await this.connectStdio();
    } else {
      throw new Error(`MCP server "${this.config.name}": must specify command (for stdio) or url (for HTTP)`);
    }

    await this.initialize();
    this.connected = true;
  }

  async listTools(): Promise<McpTool[]> {
    const result = await this.sendRequest("tools/list") as {
      tools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>;
    };

    return (result.tools ?? []).map((tool) => ({
      serverName: this.config.name,
      toolName: tool.name,
      description: tool.description ?? "",
      inputSchema: tool.inputSchema ?? { type: "object", properties: {} },
    }));
  }

  async callTool(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("tools/call", { name: toolName, arguments: input });
  }

  async disconnect(): Promise<void> {
    for (const dispose of this.disposable) {
      try {
        dispose();
      } catch { /* cleanup */ }
    }
    this.disposable = [];

    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    if (this.process) {
      this.process.stdout?.removeAllListeners();
      this.process.stderr?.removeAllListeners();
      this.killProcess();
      this.process = null;
    }

    for (const [, p] of this.pending) {
      p.reject(new Error(`MCP server "${this.config.name}" disconnected`));
    }
    this.pending.clear();

    this.requestId = 0;
    this.connected = false;
    this.serverCapabilities = null;
    this.serverVersion = null;
    this.transportSend = null;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get capabilities(): Record<string, unknown> | null {
    return this.serverCapabilities;
  }

  get version(): Record<string, unknown> | null {
    return this.serverVersion;
  }

  private async connectStdio(): Promise<TransportSend> {
    const command = this.config.command!;
    const args = this.config.args ?? [];
    const env = { ...process.env, ...(this.config.env ?? {}) };

    this.process = spawn(command, args, {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.process.once("exit", (code, signal) => {
      if (this.connected) {
        this.connected = false;
        for (const [, p] of this.pending) {
          p.reject(
            new Error(
              `MCP server "${this.config.name}" exited with code ${code}, signal ${signal}`,
            ),
          );
        }
        this.pending.clear();
      }
    });

    this.process.once("error", (err) => {
      if (this.connected) {
        this.connected = false;
        for (const [, p] of this.pending) {
          p.reject(err);
        }
        this.pending.clear();
      }
      this.process = null;
    });

    this.process.stderr?.on("data", (_data: Buffer) => {
      // stderr is for logging, not JSON-RPC
    });

    const rl = createInterface({ input: this.process.stdout!, crlfDelay: Infinity });
    this.rl = rl;

    rl.on("line", (line: string) => {
      if (!line.trim()) return;

      try {
        const msg = JSON.parse(line) as JsonRpcMessage;
        this.handleIncomingMessage(msg);
      } catch {
        // Ignore non-JSON stdout lines
      }
    });

    return async (method: string, params?: Record<string, unknown>) => {
      if (!this.process?.stdin?.writable) {
        throw new Error(`MCP server "${this.config.name}" stdin is not writable`);
      }

      const id = ++this.requestId;
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      return new Promise<unknown>((resolve, reject) => {
        const line = JSON.stringify(request) + "\n";
        this.pending.set(id, { resolve, reject });

        const timeout = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`MCP request ${method} timed out after 30s`));
        }, 30_000);

        this.process!.stdin!.write(line, (err) => {
          if (err) {
            clearTimeout(timeout);
            this.pending.delete(id);
            reject(err);
          }
        });
      });
    };
  }

  private async connectHttp(): Promise<TransportSend> {
    const url = this.config.url!;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.env?.["API_KEY"]) {
      headers["Authorization"] = `Bearer ${this.config.env["API_KEY"]}`;
    }

    // SSE connection with timeout
    const sseController = new AbortController();
    const sseTimer = setTimeout(() => sseController.abort(), this.httpTimeoutMs);

    let sseResponse: Response;
    try {
      sseResponse = await fetch(`${url}/sse`, {
        headers: { Accept: "text/event-stream" },
        signal: sseController.signal,
      });
    } finally {
      clearTimeout(sseTimer);
    }

    if (!sseResponse.ok) {
      throw new Error(`MCP server "${this.config.name}": SSE endpoint returned ${sseResponse.status}`);
    }

    const body = sseResponse.body;
    if (!body) {
      throw new Error(`MCP server "${this.config.name}": SSE endpoint returned no body`);
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sseReadAborted = false;

    // Global read-loop timeout — aborts if the SSE stream hangs indefinitely
    const sseReadTimer = setTimeout(() => {
      sseReadAborted = true;
      reader.cancel("SSE read loop timeout").catch(() => {});
    }, MCP_SSE_READ_TIMEOUT_MS);

    const readLoop = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || sseReadAborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              try {
                const msg = JSON.parse(dataStr) as JsonRpcMessage;
                this.handleIncomingMessage(msg);
              } catch {
                // Ignore parse errors in SSE data
              }
            }
          }
        }
      } catch (err) {
        if (this.connected) {
          this.connected = false;
          for (const [, p] of this.pending) {
            p.reject(err instanceof Error ? err : new Error("SSE connection error"));
          }
          this.pending.clear();
        }
      } finally {
        clearTimeout(sseReadTimer);
      }
    };

    readLoop();

    this.disposable.push(() => {
      reader.cancel().catch(() => {});
    });

    return async (method: string, params?: Record<string, unknown>) => {
      const id = ++this.requestId;
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      const postController = new AbortController();
      const postTimer = setTimeout(() => postController.abort(), this.httpTimeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(request),
          signal: postController.signal,
        });
      } finally {
        clearTimeout(postTimer);
      }

      if (!response.ok) {
        throw new Error(`MCP HTTP POST failed with status ${response.status}`);
      }

      const result = (await response.json()) as JsonRpcResponse;
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.result;
    };
  }

  private handleIncomingMessage(msg: JsonRpcMessage): void {
    if ("id" in msg && typeof msg.id === "number") {
      if ("method" in msg) {
        // Server-initiated request — not supported currently
        return;
      }
      const pending = this.pending.get(msg.id);
      if (pending) {
        if ("error" in msg) {
          pending.reject(new Error(msg.error?.message ?? "Unknown MCP error"));
        } else {
          pending.resolve(msg.result);
        }
        this.pending.delete(msg.id);
      }
    }
  }

  private async sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.transportSend) {
      throw new Error(`MCP server "${this.config.name}" is not connected`);
    }
    return this.transportSend(method, params);
  }

  private async sendNotification(method: string, params?: Record<string, unknown>): Promise<void> {
    if (!this.process?.stdin?.writable) return;

    const msg: JsonRpcNotification = {
      jsonrpc: "2.0",
      method,
      params,
    };

    const line = JSON.stringify(msg) + "\n";

    return new Promise<void>((resolve, reject) => {
      this.process!.stdin!.write(line, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async initialize(): Promise<void> {
    const result = (await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "MiLO",
        version: "0.1.0",
      },
    })) as { protocolVersion?: string; capabilities?: Record<string, unknown>; serverInfo?: Record<string, unknown> };

    this.serverCapabilities = result.capabilities ?? null;
    this.serverVersion = result.serverInfo ?? null;

    await this.sendNotification("notifications/initialized", {});
  }

  private killProcess(): void {
    if (!this.process) return;

    try {
      this.process.stdin?.end();
    } catch { /* ignore */ }

    const pid = this.process.pid;
    if (pid) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        try {
          this.process.kill("SIGTERM");
        } catch {
          try {
            this.process.kill("SIGKILL");
          } catch { /* exhausted options */ }
        }
      }
    }
  }
}
