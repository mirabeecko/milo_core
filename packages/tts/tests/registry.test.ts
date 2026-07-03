import { describe, it, expect } from "vitest";
import { TtsRegistry } from "../src/registry/index.js";
import { SayTtsProvider } from "../src/providers/say/index.js";
import { WebSpeechTtsProvider } from "../src/providers/web-speech/index.js";

describe("TtsRegistry", () => {
  it("returns null when no providers are available", async () => {
    const registry = new TtsRegistry();
    const provider = await registry.getFirstAvailable();
    expect(provider).toBeNull();
  });

  it("registers and retrieves default provider", () => {
    const registry = new TtsRegistry();
    const provider = new SayTtsProvider();
    registry.register(provider, true);

    expect(registry.getDefault()).toBe(provider);
    expect(registry.list()).toHaveLength(1);
  });

  it("returns available provider in Node.js environment", async () => {
    const registry = new TtsRegistry();
    registry.register(new WebSpeechTtsProvider());

    const provider = await registry.getFirstAvailable();
    expect(provider).toBeNull();
  });
});
