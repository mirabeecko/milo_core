import { FileText, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelative, getSourceColor, getSourceLabel } from "@/lib/format";
import type { Document } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DocumentRowProps {
  document: Document;
}

export function DocumentRow({ document: doc }: DocumentRowProps): JSX.Element {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
      <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{doc.title}</h3>
          <Badge variant="outline" className={cn("text-xs", getSourceColor(doc.source))}>
            {getSourceLabel(doc.source)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {doc.type}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{doc.snippet}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {doc.project && (
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5" />
              {doc.project}
            </span>
          )}
          <span>{formatRelative(doc.date)}</span>
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
