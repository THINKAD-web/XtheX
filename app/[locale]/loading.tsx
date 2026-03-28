import { Skeleton, MediaCardSkeleton } from "@/components/ui/skeleton";

export default function LocaleLoading() {
  return (
    <div className="min-h-[60vh] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Skeleton className="mt-3 h-5 w-96" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
