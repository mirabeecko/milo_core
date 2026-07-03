import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelative, getStatusColor, getStatusLabel } from "@/lib/format";
import type { DecisionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DecisionRowProps {
  decision: DecisionItem;
}

export function DecisionRow({ decision }: DecisionRowProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{decision.title}</p>
          <Badge variant="outline" className={cn("text-xs", getStatusColor(decision.status))}>
            {getStatusLabel(decision.status)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{decision.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {decision.source} · {formatRelative(decision.date)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline">
          Odložit
        </Button>
        <Button size="sm" className="gap-1">
          <Zap className="h-3.5 w-3.5" />
          Rozhodnout
        </Button>
      </div>
    </div>
  );
}
