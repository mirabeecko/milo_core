"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface UseDataRefreshOptions {
  dataUpdatedAt: number;
  isFetching: boolean;
  staleTimeMs?: number;
}

export function useDataRefreshPulse({
  dataUpdatedAt,
  isFetching,
  staleTimeMs = 5000,
}: UseDataRefreshOptions): string {
  const [pulse, setPulse] = useState(false);
  const prevRef = useRef(dataUpdatedAt);

  useEffect(() => {
    if (isFetching) return;
    if (dataUpdatedAt !== prevRef.current && prevRef.current !== 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1500);
      prevRef.current = dataUpdatedAt;
      return () => clearTimeout(t);
    }
    prevRef.current = dataUpdatedAt;
  }, [dataUpdatedAt, isFetching]);

  return pulse ? "animate-data-refresh" : "";
}
