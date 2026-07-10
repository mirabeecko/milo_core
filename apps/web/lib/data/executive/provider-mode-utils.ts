"use client";

export type ProviderMode = "auto" | "file" | "mock" | "api" | "realtime";

export function getStoredProviderMode(): ProviderMode {
  if (typeof window === "undefined") return "api";
  const stored = localStorage.getItem("milo:executive-provider");
  if (stored === "file" || stored === "mock" || stored === "api" || stored === "realtime") return stored as ProviderMode;
  return "api";
}

export function setStoredProviderMode(mode: ProviderMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("milo:executive-provider", mode);
}

export function cycleProviderMode(current: ProviderMode): ProviderMode {
  const modes: ProviderMode[] = ["api", "mock", "realtime"];
  const idx = modes.indexOf(current as ProviderMode);
  const next = modes[(idx + 1) % modes.length];
  setStoredProviderMode(next);
  return next;
}
