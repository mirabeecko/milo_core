import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4">
      <Skeleton className="mb-4 h-12 w-full" />
      <div className="flex-1 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="mt-4 h-12 w-full" />
    </div>
  );
}
