"use client";

import * as React from "react";
import { Star } from "lucide-react";

type ReviewUser = {
  id: string;
  name: string | null;
  image: string | null;
};

type Review = {
  id: string;
  mediaId: string;
  userId: string;
  rating: number;
  content: string | null;
  images: string[];
  createdAt: string;
  user: ReviewUser;
};

type ReviewsResponse = {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
};

type Props = {
  mediaId: string;
  locale: string;
};

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-zinc-600"
          }`}
        />
      ))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = React.useState(0);

  return (
    <span className="inline-flex gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const active = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-zinc-600"
              }`}
            />
          </button>
        );
      })}
    </span>
  );
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(
    locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );
}

export function ReviewSection({ mediaId, locale }: Props) {
  const isKo = locale === "ko";
  const [data, setData] = React.useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState(false);

  const fetchReviews = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?mediaId=${mediaId}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [mediaId]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(isKo ? "별점을 선택해주세요." : "Please select a rating.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId,
          rating,
          content: content.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        setAuthError(true);
        return;
      }

      if (res.status === 409) {
        setError(
          isKo
            ? "이미 이 매체에 리뷰를 작성하셨습니다."
            : "You have already reviewed this media.",
        );
        return;
      }

      if (!res.ok) {
        setError(isKo ? "리뷰 작성에 실패했습니다." : "Failed to submit review.");
        return;
      }

      setRating(0);
      setContent("");
      await fetchReviews();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 ring-1 ring-zinc-800">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {isKo ? "리뷰" : "Reviews"}
      </h2>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="h-16 w-full animate-pulse rounded bg-zinc-800" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-zinc-100">
              {data && data.totalCount > 0
                ? data.averageRating.toFixed(1)
                : "—"}
            </span>
            {data && data.totalCount > 0 && (
              <StarRating rating={Math.round(data.averageRating)} />
            )}
            <span className="text-sm text-zinc-500">
              {data?.totalCount ?? 0}{" "}
              {isKo ? "개 리뷰" : data?.totalCount === 1 ? "review" : "reviews"}
            </span>
          </div>

          {/* Write review form */}
          {!authError ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  {isKo ? "별점" : "Rating"}
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  isKo
                    ? "이 매체에 대한 경험을 공유해주세요..."
                    : "Share your experience with this media..."
                }
                maxLength={2000}
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                {submitting
                  ? isKo
                    ? "제출 중..."
                    : "Submitting..."
                  : isKo
                    ? "리뷰 작성"
                    : "Submit Review"}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              {isKo
                ? "리뷰를 작성하려면 로그인이 필요합니다."
                : "Please sign in to write a review."}
            </p>
          )}

          {/* Review list */}
          {data && data.reviews.length > 0 && (
            <ul className="mt-6 divide-y divide-zinc-800">
              {data.reviews.map((review) => (
                <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300">
                      {(review.user.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">
                          {review.user.name ?? (isKo ? "익명" : "Anonymous")}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {formatDate(review.createdAt, locale)}
                        </span>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  {review.content && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {review.content}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {data && data.reviews.length === 0 && (
            <p className="mt-4 text-sm text-zinc-500">
              {isKo
                ? "아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!"
                : "No reviews yet. Be the first to write one!"}
            </p>
          )}
        </>
      )}
    </section>
  );
}
