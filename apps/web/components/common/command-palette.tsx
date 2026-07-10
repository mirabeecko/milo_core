"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Sunrise,
  FolderKanban,
  Bot,
  FileText,
  BookOpen,
  Mail,
  Calendar,
  Settings,
  MessageSquare,
  Activity,
  Bell,
  ListTodo,
  Briefcase,
  GitBranch,
  Play,
  Square,
  Search,
  Zap,
  ScanLine,
  PlusCircle,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

export function CommandPalette(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const groups: CommandGroup[] = [
    {
      heading: "Navigace",
      items: [
        { id: "home", label: "Home", description: "Domovská stránka", icon: Home, action: () => router.push("/") },
        { id: "brief", label: "Today's Brief", description: "Denní přehled", icon: Sunrise, action: () => router.push("/brief") },
        { id: "projects", label: "Projekty", description: "Seznam projektů", icon: FolderKanban, action: () => router.push("/projects") },
        { id: "projects-activity", label: "Aktivita projektů", description: "Historie změn", icon: GitBranch, action: () => router.push("/projects/activity") },
        { id: "tasks", label: "Úkoly", description: "Správa úkolů", icon: ListTodo, action: () => router.push("/tasks") },
        { id: "agents", label: "Agenti", description: "Agent Operating Center", shortcut: "G A", icon: Bot, action: () => router.push("/agents") },
        { id: "workflow", label: "Live Workflow", description: "Probíhající procesy", icon: Activity, action: () => router.push("/workflow") },
        { id: "jobs", label: "Job Board", description: "Práce a zakázky", icon: Briefcase, action: () => router.push("/jobs") },
        { id: "documents", label: "Dokumenty", description: "Správa dokumentů", icon: FileText, action: () => router.push("/documents") },
        { id: "knowledge", label: "Knowledge Base", description: "Znalostní báze", icon: BookOpen, action: () => router.push("/knowledge") },
        { id: "email", label: "E-mail", description: "Poštovní schránka", shortcut: "G E", icon: Mail, action: () => router.push("/email") },
        { id: "calendar", label: "Kalendář", description: "Správa času", shortcut: "G C", icon: Calendar, action: () => router.push("/calendar") },
        { id: "chat", label: "Chat", description: "Konverzace s AI", icon: MessageSquare, action: () => router.push("/chat") },
        { id: "activity", label: "Aktivita", description: "Přehled událostí", icon: Activity, action: () => router.push("/activity") },
        { id: "notifications", label: "Notifikace", description: "Centrum oznámení", icon: Bell, action: () => router.push("/notifications") },
        { id: "settings", label: "Nastavení", description: "Konfigurace systému", icon: Settings, action: () => router.push("/settings") },
      ],
    },
    {
      heading: "Akce",
      items: [
        {
          id: "start-all",
          label: "Spustit všechny agenty",
          description: "Aktivuje všechny registrované agenty",
          icon: Play,
          action: () => {
            router.push("/agents");
          },
        },
        {
          id: "stop-all",
          label: "Zastavit všechny agenty",
          description: "Deaktivuje všechny běžící agenty",
          icon: Square,
          action: () => {
            router.push("/agents");
          },
        },
        {
          id: "sync-calendar",
          label: "Synchronizovat kalendář",
          description: "Synchronizuje události s Google Kalendářem",
          icon: Calendar,
          action: () => {
            router.push("/calendar");
          },
        },
        {
          id: "scan-projects",
          label: "Skenovat projekty",
          description: "Prohledá a aktualizuje stav projektů",
          icon: ScanLine,
          action: () => {
            router.push("/projects");
          },
        },
        {
          id: "new-task",
          label: "Nový úkol",
          description: "Vytvoří nový úkol",
          shortcut: "N T",
          icon: PlusCircle,
          action: () => {
            router.push("/tasks");
          },
        },
        {
          id: "new-project",
          label: "Nový projekt",
          description: "Vytvoří nový projekt",
          icon: FolderPlus,
          action: () => {
            router.push("/projects");
          },
        },
      ],
    },
    {
      heading: "Agenti",
      items: [
        { id: "agent-chief-of-staff", label: "Chief of Staff", description: "Digitální ředitel kanceláře", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-developer", label: "Developer Agent", description: "Senior software engineer", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-research", label: "Research Agent", description: "Research analytik", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-knowledge", label: "Knowledge Agent", description: "Správce znalostní báze", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-legal", label: "Legal Agent", description: "Právní analytik", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-document", label: "Document Agent", description: "Zpracovatel dokumentů", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-calendar", label: "Calendar Agent", description: "Osobní manažer času", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-communication", label: "Communication Agent", description: "Komunikační manažer", icon: Bot, action: () => router.push("/agents") },
        { id: "agent-automation", label: "Automation Agent", description: "Automatizační inženýr", icon: Bot, action: () => router.push("/agents") },
      ],
    },
  ];

  const allItems = groups.flatMap((g) => g.items);

  const filteredGroups = query.trim()
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.label.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((group) => group.items.length > 0)
    : groups;

  const flatFiltered = filteredGroups.flatMap((g) => g.items);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatFiltered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatFiltered.length) % flatFiltered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatFiltered[selectedIndex];
      if (item) {
        item.action();
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (!open) return <></>;

  const globalIndex = (groupIndex: number, itemIndex: number) => {
    let count = 0;
    for (let i = 0; i < groupIndex; i++) {
      count += filteredGroups[i].items.length;
    }
    return count + itemIndex;
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-0 top-[20%] mx-auto max-w-lg">
        <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hledat příkaz nebo stránku..."
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-80 overflow-auto p-2">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Zap className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nic nenalezeno</p>
              </div>
            ) : (
              filteredGroups.map((group, groupIndex) => (
                <div key={group.heading} className="mb-2 last:mb-0">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group.heading}
                  </div>
                  {group.items.map((item, itemIndex) => {
                    const idx = globalIndex(groupIndex, itemIndex);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.action();
                          setOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors text-left",
                          idx === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                        {item.shortcut && (
                          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">↑↓</kbd>
              <span>Navigace</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">↵</kbd>
              <span>Otevřít</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">esc</kbd>
              <span>Zavřít</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
