import { Star } from "lucide-react";

export function TrustBadge({
  avgRating,
  reviewCount,
  locale,
}: {
  avgRating: number;
  reviewCount: number;
  locale: string;
}) {
  if (reviewCount <= 0 || !Number.isFinite(avgRating)) return null;
  const isKo = locale.startsWith("ko");
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/35">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      {avgRating.toFixed(1)} · {reviewCount} {isKo ? "리뷰" : "reviews"}
    </span>
  );
}
