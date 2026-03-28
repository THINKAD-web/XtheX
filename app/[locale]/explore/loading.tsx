import {
  MediaCardSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
