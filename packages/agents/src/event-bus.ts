import type { AgentEventBus, AgentFrameworkEvent } from "./types.js";

export class InMemoryAgentEventBus implements AgentEventBus {
  private handlers = new Set<(event: AgentFrameworkEvent) => void | Promise<void>>();

  async publish(event: AgentFrameworkEvent): Promise<void> {
    const promises: Array<void | Promise<void>> = [];
    for (const handler of this.handlers) {
      promises.push(handler(event));
    }
    await Promise.all(promises);
  }

  subscribe(handler: (event: AgentFrameworkEvent) => void | Promise<void>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}
