import {
  Skeleton,
  DashboardStatSkeleton,
  DashboardTableSkeleton,
} from "@/components/ui/skeleton";

export default function AdvertiserDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-background to-emerald-50/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/25">
      <div className="fixed left-0 right-0 top-0 z-50 h-14 animate-pulse border-b border-border bg-muted/60 backdrop-blur-sm" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-24 sm:px-6 lg:space-y-10 lg:px-8">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <DashboardStatSkeleton key={i} />
          ))}
        </div>
        <DashboardTableSkeleton rows={3} />
      </div>
    </div>
  );
}
