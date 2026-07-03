import { Badge } from "@/components/ui/badge";
import { getPriorityColor, getPriorityLabel } from "@/lib/format";
import type { PriorityItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PriorityRowProps {
  priority: PriorityItem;
}

export function PriorityRow({ priority }: PriorityRowProps): JSX.Element {
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card">
      <div
        className={cn(
          "mt-0.5 h-2.5 w-2.5 rounded-full border",
          priority.priority === "critical" && "bg-rose-500 border-rose-500",
          priority.priority === "important" && "bg-amber-500 border-amber-500",
          priority.priority === "low" && "bg-emerald-500 border-emerald-500",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{priority.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className={cn("text-xs", getPriorityColor(priority.priority))}>
            {getPriorityLabel(priority.priority)}
          </Badge>
          {priority.project && <span>{priority.project}</span>}
          {priority.due && <span>· {priority.due}</span>}
        </div>
      </div>
    </div>
  );
}
