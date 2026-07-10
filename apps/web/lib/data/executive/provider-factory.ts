import type { ExecutiveDataProvider } from "./provider-interface";
import { MockExecutiveDataProvider, ApiExecutiveDataProvider } from "./providers";

export type ProviderMode = "auto" | "file" | "mock" | "api" | "realtime";

let _manualOverride: ProviderMode | null = null;
let _cachedProvider: ExecutiveDataProvider | null = null;
let _cachedMode: ProviderMode | null = null;

export function setExecutiveProviderOverride(mode: ProviderMode | null): void {
  _manualOverride = mode;
  _cachedProvider = null;
  _cachedMode = null;
}

export function getExecutiveProviderMode(): ProviderMode {
  if (_manualOverride) return _manualOverride;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("milo:executive-provider");
    if (stored === "file" || stored === "mock" || stored === "api" || stored === "realtime") return stored as ProviderMode;
  }

  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_EXECUTIVE_PROVIDER) {
    const env = process.env.NEXT_PUBLIC_EXECUTIVE_PROVIDER;
    if (env === "file" || env === "mock" || env === "api" || env === "realtime") return env as ProviderMode;
  }

  return "api";
}

async function loadFileProvider(): Promise<ExecutiveDataProvider> {
  const mod = await import("./providers/file-executive-data-provider");
  return new mod.FileExecutiveDataProvider();
}

async function loadSseProvider(): Promise<ExecutiveDataProvider> {
  if (typeof window === "undefined") return new ApiExecutiveDataProvider();
  const mod = await import("./providers/sse-executive-data-provider");
  const provider = new mod.SseExecutiveDataProvider();
  await provider.connect();
  return provider;
}

export async function getExecutiveProviderAsync(): Promise<ExecutiveDataProvider> {
  const mode = getExecutiveProviderMode();

  if (_cachedProvider && _cachedMode === mode) return _cachedProvider;

  let provider: ExecutiveDataProvider;

  switch (mode) {
    case "file":
      provider = await loadFileProvider();
      break;
    case "mock":
      provider = new MockExecutiveDataProvider();
      break;
    case "realtime":
      provider = await loadSseProvider();
      break;
    case "api":
    default:
      provider = new ApiExecutiveDataProvider();
      break;
  }

  _cachedProvider = provider;
  _cachedMode = mode;

  return provider;
}

export function getExecutiveProvider(): ExecutiveDataProvider {
  const mode = getExecutiveProviderMode();

  if (_cachedProvider && _cachedMode === mode) return _cachedProvider;

  switch (mode) {
    case "mock":
      _cachedProvider = new MockExecutiveDataProvider();
      break;
    case "realtime":
    case "api":
    default:
      _cachedProvider = new ApiExecutiveDataProvider();
      break;
  }

  _cachedMode = mode;
  if (_cachedProvider) return _cachedProvider;
  return new ApiExecutiveDataProvider();
}

export function clearExecutiveProviderCache(): void {
  _cachedProvider = null;
  _cachedMode = null;
}
