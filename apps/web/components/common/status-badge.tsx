import { Badge } from "@/components/ui/badge";
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/format";
import type { Priority, ProjectStatus, Status } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusBadgeValue = Priority | Status | ProjectStatus;

interface StatusBadgeProps {
  value: StatusBadgeValue;
  variant?: "priority" | "status";
  className?: string;
}

export function StatusBadge({ value, variant = "status", className }: StatusBadgeProps): JSX.Element {
  const colorClass = variant === "priority" ? getPriorityColor(value as Priority) : getStatusColor(value as Status);
  const label = variant === "priority" ? getPriorityLabel(value as Priority) : getStatusLabel(value as Status);

  return (
    <Badge variant="outline" className={cn("text-xs", colorClass, className)}>
      {label}
    </Badge>
  );
}
