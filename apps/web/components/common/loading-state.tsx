import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 4, className }: LoadingStateProps): JSX.Element {
  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <Skeleton className="h-8 w-1/3" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}
