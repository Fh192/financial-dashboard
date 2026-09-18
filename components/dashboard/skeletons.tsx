import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryCardsSkeleton() {
  return Array.from({ length: 4 }, (_, i) => (
    <Card key={i}>
      <CardHeader>
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-36" />
      </CardContent>
    </Card>
  ));
}

export function RevenueChartSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full" />
      </CardContent>
    </Card>
  );
}

export function LatestInvoicesSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCardsSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChartSkeleton />
        </div>
        <div className="lg:col-span-3">
          <LatestInvoicesSkeleton />
        </div>
      </div>
    </>
  );
}
