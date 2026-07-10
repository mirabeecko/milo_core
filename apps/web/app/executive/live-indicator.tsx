"use client";

import { cn } from "@/lib/utils";
import { Radio, Wifi, WifiOff } from "lucide-react";

interface Props {
  isFetching: boolean;
  isStale: boolean;
  isError: boolean;
  dataUpdatedAt: number;
  source?: string;
  className?: string;
}

export function LiveIndicator({
  isFetching,
  isStale,
  isError,
  dataUpdatedAt,
  source,
  className,
}: Props) {
  const updatedAgo = dataUpdatedAt
    ? Math.floor((Date.now() - dataUpdatedAt) / 1000)
    : null;

  const agoText = updatedAgo
    ? updatedAgo < 60
      ? `${updatedAgo}s ago`
      : updatedAgo < 3600
        ? `${Math.floor(updatedAgo / 60)}m ago`
        : `${Math.floor(updatedAgo / 3600)}h ago`
    : null;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px]", className)}>
      {isError ? (
        <>
          <WifiOff className="h-3 w-3 text-rose-500" />
          <span className="text-rose-500">Offline</span>
          {agoText && <span className="text-rose-500/70">· {agoText}</span>}
        </>
      ) : isFetching ? (
        <>
          <Radio className="h-3 w-3 text-amber-500 animate-pulse" />
          <span className="text-amber-500">Updating</span>
        </>
      ) : isStale ? (
        <>
          <Wifi className="h-3 w-3 text-amber-500" />
          <span className="text-amber-500">Stale</span>
          {agoText && <span className="text-amber-500/70">· {agoText}</span>}
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-500">Live</span>
          {agoText && <span className="text-muted-foreground">· {agoText}</span>}
        </>
      )}
      {source && <span className="text-muted-foreground">· {source}</span>}
    </span>
  );
}
