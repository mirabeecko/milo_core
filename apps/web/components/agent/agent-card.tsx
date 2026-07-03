import {
  BookOpen,
  Bot,
  Code,
  Scale,
  Search,
  Sunrise,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative, getStatusColor, getStatusLabel } from "@/lib/format";
import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  sunrise: Sunrise,
  scale: Scale,
  search: Search,
  code: Code,
  "book-open": BookOpen,
  bot: Bot,
};

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
}

export function AgentCard({ agent, isSelected, onClick }: AgentCardProps): JSX.Element {
  const Icon = iconMap[agent.icon] ?? Bot;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-primary/50",
        isSelected && "border-primary ring-1 ring-primary",
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{agent.name}</h3>
              <Badge variant="outline" className={cn("text-xs", getStatusColor(agent.status))}>
                {getStatusLabel(agent.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{agent.role}</p>
            <p className="mt-2 text-sm">{agent.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Terminal className="h-3.5 w-3.5" />
                {agent.currentTask}
              </span>
              <span>Poslední aktivita: {formatRelative(agent.lastActive)}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0">
            Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
