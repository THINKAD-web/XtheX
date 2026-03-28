import {
  Skeleton,
  DashboardStatSkeleton,
  DashboardTableSkeleton,
} from "@/components/ui/skeleton";

export default function PartnerDashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <DashboardStatSkeleton key={i} />
          ))}
        </div>
        <DashboardTableSkeleton rows={5} />
      </div>
    </div>
  );
}
