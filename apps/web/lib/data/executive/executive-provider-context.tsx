"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ExecutiveDataProvider } from "./provider-interface";
import { MockExecutiveDataProvider, ApiExecutiveDataProvider } from "./providers";
import type { SseExecutiveDataProvider } from "./providers/sse-executive-data-provider";

let _defaultProvider: ExecutiveDataProvider | null = null;
let _pendingRealtime: SseExecutiveDataProvider | null = null;

function getDefaultProvider(): ExecutiveDataProvider {
  if (_defaultProvider) return _defaultProvider;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("milo:executive-provider");
    if (stored === "mock") {
      _defaultProvider = new MockExecutiveDataProvider();
      return _defaultProvider;
    }
    if (stored === "realtime") {
      _defaultProvider = new ApiExecutiveDataProvider();
      initRealtimeAsync();
      return _defaultProvider;
    }
  }

  _defaultProvider = new ApiExecutiveDataProvider();
  return _defaultProvider;
}

async function initRealtimeAsync(): Promise<void> {
  try {
    const mod = await import("./providers/sse-executive-data-provider");
    const provider = new mod.SseExecutiveDataProvider();
    await provider.connect();
    _pendingRealtime = provider as unknown as SseExecutiveDataProvider;
    _defaultProvider = provider as unknown as ExecutiveDataProvider;
  } catch {
    _pendingRealtime = null;
  }
}

export function clearDefaultProvider(): void {
  _defaultProvider = null;
  _pendingRealtime?.disconnect();
  _pendingRealtime = null;
}

const ExecutiveProviderContext = createContext<ExecutiveDataProvider | null>(null);

export function useExecutiveDataProvider(): ExecutiveDataProvider {
  const ctx = useContext(ExecutiveProviderContext);
  if (ctx) return ctx;
  return getDefaultProvider();
}

export function ExecutiveProviderProvider({
  provider,
  children,
}: {
  provider?: ExecutiveDataProvider;
  children: ReactNode;
}) {
  return (
    <ExecutiveProviderContext.Provider value={provider ?? null}>
      {children}
    </ExecutiveProviderContext.Provider>
  );
}
