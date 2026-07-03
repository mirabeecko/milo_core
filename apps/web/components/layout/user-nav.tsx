"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserNav(): JSX.Element {
  return (
    <Button variant="ghost" size="icon" className="rounded-full">
      <User className="h-5 w-5" />
      <span className="sr-only">Uživatelské menu</span>
    </Button>
  );
}
