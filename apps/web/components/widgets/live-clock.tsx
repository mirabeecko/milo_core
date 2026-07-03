"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";

export function LiveClock(): JSX.Element {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
    );
  }

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return (
    <div className="flex flex-col">
      <div className="text-5xl font-bold tracking-tight tabular-nums">
        {hours}:{minutes}
      </div>
      <div className="mt-1 text-sm font-medium text-muted-foreground capitalize">
        {formatDate(now)}
      </div>
    </div>
  );
}
