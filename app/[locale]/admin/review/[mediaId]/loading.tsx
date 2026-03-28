import { Skeleton, DetailPageSkeleton } from "@/components/ui/skeleton";

export default function AdminReviewLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <DetailPageSkeleton />
      </div>
    </div>
  );
}
