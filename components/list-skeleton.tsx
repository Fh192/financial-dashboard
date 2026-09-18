import { Skeleton } from "@/components/ui/skeleton";

/** Скелетон списка (таблицы) на время загрузки. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="hidden h-4 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}
