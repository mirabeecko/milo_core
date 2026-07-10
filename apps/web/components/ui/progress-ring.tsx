import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

const RING_COLORS: Record<string, { stroke: string; bg: string }> = {
  emerald: { stroke: "stroke-emerald-500", bg: "stroke-emerald-500/15" },
  blue: { stroke: "stroke-blue-500", bg: "stroke-blue-500/15" },
  amber: { stroke: "stroke-amber-500", bg: "stroke-amber-500/15" },
  rose: { stroke: "stroke-rose-500", bg: "stroke-rose-500/15" },
  violet: { stroke: "stroke-violet-500", bg: "stroke-violet-500/15" },
  muted: { stroke: "stroke-muted-foreground/30", bg: "stroke-muted-foreground/10" },
};

export function ProgressRing({
  value,
  size = 40,
  strokeWidth = 3,
  color = "emerald",
  bgColor,
  label,
  className,
  children,
}: ProgressRingProps) {
  const colors = RING_COLORS[color] ?? RING_COLORS.emerald;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColor ?? colors.bg}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
      {label && !children && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
