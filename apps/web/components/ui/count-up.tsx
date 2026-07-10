"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({ from, to, duration = 0.5, className }: CountUpProps) {
  const [display, setDisplay] = useState(from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (from === to) {
      setDisplay(to);
      return;
    }

    let startTs: number | null = null;

    function step(timestamp: number) {
      if (!startTs) startTs = timestamp;
      const elapsed = (timestamp - startTs) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplay(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration]);

  return <span className={className}>{display}</span>;
}
