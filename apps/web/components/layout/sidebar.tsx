"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  Home,
  FolderKanban,
  Sunrise,
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
  Menu,
  X,
  Briefcase,
  GitBranch,
  Sparkles,
  Building2,
  Cpu,
  SlidersHorizontal,
  BarChart3,
  MapPin,
  Eye,
  ArrowRightLeft,
  Rocket,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "MONITORING", href: "/realtime", icon: Radio, highlight: true, color: "text-red-400" },
  { name: "TESTER", href: "/tester", icon: Zap, highlight: true, color: "text-yellow-400" },
  { name: "Workspace", href: "/workspace", icon: Rocket, highlight: true, color: "text-purple-400" },
  { name: "Home", href: "/", icon: Home },
  { name: "SPY_G", href: "/spyg", icon: Eye },
  { name: "Projekty", href: "/projekty", icon: FolderKanban },
  { name: "Executive", href: "/executive", icon: Building2 },
  { name: "J.A.R.V.I.S.", href: "/executive/jarvis", icon: Cpu },
  { name: "Control Center", href: "/executive/control", icon: SlidersHorizontal },
  { name: "Progress Pipeline", href: "/progress", icon: BarChart3 },
  { name: "Today's Brief", href: "/brief", icon: Sunrise },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Project Activity", href: "/projects/activity", icon: GitBranch },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Live Workflow", href: "/workflow", icon: Activity },
  { name: "Job Board", href: "/jobs", icon: Briefcase },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Knowledge", href: "/knowledge", icon: BookOpen },
  { name: "Email", href: "/email", icon: Mail },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Delegace", href: "/delegations", icon: ArrowRightLeft },
  { name: "Phone Tracker", href: "/phone-tracker", icon: MapPin },
  { name: "Better Agents", href: "/better-agents", icon: Sparkles },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps): JSX.Element {
  const pathname = usePathname();

  const handleNavClick = () => {
    onMobileClose();
  };

  const navContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={handleNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm shadow-primary/25" style={{ background: "linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(220 70% 50%) 100%)" }}>
            M
          </div>
          <span className="text-lg font-semibold tracking-tight text-gradient">MiLO</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all border-l-2",
                isActive
                  ? "bg-primary/10 text-primary border-l-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border-l-transparent",
              )}
              style={item.highlight && item.color ? { color: item.color === "text-red-400" ? "#f87171" : item.color === "text-yellow-400" ? "#fbbf24" : "#a855f7", fontWeight: 700, borderLeftColor: item.color === "text-red-400" ? "#f87171" : item.color === "text-yellow-400" ? "#fbbf24" : "#a855f7", animation: "pulse 2s infinite" } : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card shrink-0">
        {navContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-xl animate-in slide-in-from-left">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
