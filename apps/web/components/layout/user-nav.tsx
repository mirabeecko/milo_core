"use client";

import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

export function UserNav(): JSX.Element {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-2">
      {user && (
        <span className="hidden text-sm text-muted-foreground md:inline">
          {user.name ?? user.email}
        </span>
      )}
      <Button variant="ghost" size="icon" className="rounded-full">
        <User className="h-5 w-5" />
        <span className="sr-only">Uživatelské menu</span>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSignOut}>
        <LogOut className="h-5 w-5" />
        <span className="sr-only">Odhlásit se</span>
      </Button>
    </div>
  );
}
