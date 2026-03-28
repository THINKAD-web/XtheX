"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Flag, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAppDate } from "@/lib/i18n/format";

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
    <span className="inline-flex gap-0.5" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-zinc-600"
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
    <span className="inline-flex gap-1" role="group" aria-label="Rating">
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
                active ? "fill-amber-400 text-amber-400" : "fill-transparent text-zinc-600"
              }`}
            />
          </button>
        );
      })}
    </span>
  );
}

export function ReviewSection({ mediaId, locale }: Props) {
  const t = useTranslations("media_reviews");
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const sessionUserId = session?.user?.id?.trim() ?? null;

  const [data, setData] = React.useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<"recent" | "rating">("recent");

  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReviewId, setReportReviewId] = React.useState<string | null>(null);
  const [reportReason, setReportReason] = React.useState("");
  const [reportSubmitting, setReportSubmitting] = React.useState(false);

  const fetchReviews = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?mediaId=${mediaId}&sort=${sort}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [mediaId, sort]);

  React.useEffect(() => {
    setLoading(true);
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(t("error_rating_required"));
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
        toast.error(t("sign_in_required"));
        return;
      }

      if (res.status === 409) {
        setError(t("error_already_reviewed"));
        return;
      }

      if (!res.ok) {
        setError(t("error_submit_failed"));
        return;
      }

      setRating(0);
      setContent("");
      await fetchReviews();
      toast.success(t("submit_success"));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReport() {
    if (!reportReviewId) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reportReviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim() || undefined }),
      });
      if (res.status === 401) {
        toast.error(t("sign_in_required"));
        return;
      }
      if (res.status === 409) {
        toast.info(t("report_already"));
        setReportOpen(false);
        return;
      }
      if (!res.ok) {
        toast.error(t("report_failed"));
        return;
      }
      toast.success(t("report_success"));
      setReportOpen(false);
      setReportReason("");
      setReportReviewId(null);
    } finally {
      setReportSubmitting(false);
    }
  }

  const roundedAvg =
    data && data.totalCount > 0 ? Math.min(5, Math.max(1, Math.round(data.averageRating))) : 0;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 ring-1 ring-zinc-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("title")}</h2>
        {data && data.totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Label className="sr-only" htmlFor="review-sort">
              {t("sort_label")}
            </Label>
            <Select value={sort} onValueChange={(v) => setSort(v as "recent" | "rating")}>
              <SelectTrigger id="review-sort" className="h-9 w-[180px] border-zinc-700 bg-zinc-800/60 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t("sort_recent")}</SelectItem>
                <SelectItem value="rating">{t("sort_rating")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="h-16 w-full animate-pulse rounded bg-zinc-800" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-zinc-100">
              {data && data.totalCount > 0 ? data.averageRating.toFixed(1) : "—"}
            </span>
            {data && data.totalCount > 0 && <StarRating rating={roundedAvg} />}
            <span className="text-sm text-zinc-500">
              {data?.totalCount ?? 0} {t("reviews_suffix")}
            </span>
          </div>

          {sessionStatus === "authenticated" ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{t("rating_label")}</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("content_placeholder")}
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
                {submitting ? t("submitting") : t("submit")}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              {t("sign_in_prompt")}{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`}
                className="font-medium text-amber-400 underline-offset-2 hover:underline"
              >
                {t("sign_in_link")}
              </Link>
            </p>
          )}

          {data && data.reviews.length > 0 && (
            <ul className="mt-6 divide-y divide-zinc-800">
              {data.reviews.map((review) => {
                const isOwn = sessionUserId != null && review.userId === sessionUserId;
                const canReport = sessionStatus === "authenticated" && !isOwn;
                return (
                  <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300">
                          {(review.user.name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-zinc-200">
                              {review.user.name ?? t("anonymous")}
                            </span>
                            <span className="text-xs text-zinc-600">{formatAppDate(review.createdAt, locale, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}</span>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      {canReport && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 shrink-0 gap-1 text-xs text-zinc-500 hover:text-amber-400"
                          onClick={() => {
                            setReportReviewId(review.id);
                            setReportReason("");
                            setReportOpen(true);
                          }}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          {t("report")}
                        </Button>
                      )}
                    </div>
                    {review.content && (
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{review.content}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {data && data.reviews.length === 0 && (
            <p className="mt-4 text-sm text-zinc-500">{t("empty")}</p>
          )}
        </>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("report_title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">{t("report_desc")}</p>
          <div className="space-y-2">
            <Label htmlFor="report-reason">{t("report_reason_label")}</Label>
            <Textarea
              id="report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t("report_reason_ph")}
              maxLength={2000}
              rows={3}
              className="border-zinc-700 bg-zinc-800/80 text-zinc-100"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="border-zinc-600" onClick={() => setReportOpen(false)}>
              {t("report_cancel")}
            </Button>
            <Button type="button" disabled={reportSubmitting} onClick={submitReport}>
              {reportSubmitting ? t("report_submitting") : t("report_submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
