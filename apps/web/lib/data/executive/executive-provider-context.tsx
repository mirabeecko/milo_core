"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ExecutiveDataProvider } from "./provider-interface";
import { MockExecutiveDataProvider, ApiExecutiveDataProvider } from "./providers";

let _defaultProvider: ExecutiveDataProvider | null = null;

function getDefaultProvider(): ExecutiveDataProvider {
  if (_defaultProvider) return _defaultProvider;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("milo:executive-provider");
    if (stored === "mock") {
      _defaultProvider = new MockExecutiveDataProvider();
      return _defaultProvider;
    }
  }

  _defaultProvider = new ApiExecutiveDataProvider();
  return _defaultProvider;
}

export function clearDefaultProvider(): void {
  _defaultProvider = null;
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
