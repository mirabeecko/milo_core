import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "default" | "error";

interface EmptyStateProps {
  title?: string;
  description?: string;
  variant?: EmptyStateVariant;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const icons: Record<EmptyStateVariant, typeof Inbox> = {
  default: Inbox,
  error: AlertCircle,
};

export function EmptyState({
  title,
  description,
  variant = "default",
  icon,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center",
        variant === "error" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card/50",
        className,
      )}
    >
      {icon ?? (
        <Icon
          className={cn(
            "h-10 w-10",
            variant === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        />
      )}
      <div className="space-y-1">
        {title && (
          <h3
            className={cn(
              "text-lg font-semibold",
              variant === "error" ? "text-destructive" : "text-foreground",
            )}
          >
            {title}
          </h3>
        )}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
