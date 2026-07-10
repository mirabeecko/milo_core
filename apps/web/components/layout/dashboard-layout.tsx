"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({ open: false, setOpen: () => {} });

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext);
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open: mobileOpen, setOpen: setMobileOpen }}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden -ml-2 mr-2"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </Header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
