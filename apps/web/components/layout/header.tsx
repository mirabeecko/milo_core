"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UserNav } from "./user-nav";
import { TtsControls } from "../tts/tts-controls";
import { VoiceControls } from "../voice/voice-controls";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/executive": "Executive Overview",
  "/executive/missions": "Mise",
  "/executive/departments": "Executive Departments",
  "/executive/artifacts": "Artifacts & Decisions",
  "/executive/risks": "Risks & Blockers",
  "/executive/approvals": "Owner Approvals",
  "/executive/activity": "Activity Timeline",
  "/brief": "Today's Brief",
  "/projects": "Projekty",
  "/projects/activity": "Aktivita projektů",
  "/tasks": "Úkoly",
  "/agents": "Agenti",
  "/workflow": "Live Workflow",
  "/jobs": "Job Board",
  "/documents": "Dokumenty",
  "/knowledge": "Knowledge Base",
  "/email": "E-mail",
  "/calendar": "Kalendář",
  "/chat": "Chat",
  "/activity": "Aktivita",
  "/notifications": "Notifikace",
  "/settings": "Nastavení",
};

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps): JSX.Element {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";

  const triggerCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shrink-0" style={{ borderImage: "linear-gradient(to right, hsl(263 70% 50% / 0.4), transparent) 1" }}>
      <div className="flex items-center gap-4">
        {children}
        <h1 className="text-lg font-semibold hidden sm:block">{title}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={triggerCommandPalette}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:border-primary/30 hover:text-foreground transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span className="hidden lg:inline">Hledat příkaz...</span>
          <kbd className="font-mono text-[11px] font-medium text-muted-foreground/70">⌘K</kbd>
        </button>
        <div className="hidden sm:flex items-center gap-1">
          <VoiceControls />
          <TtsControls />
        </div>
        <UserNav />
      </div>
    </header>
  );
}
