"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function InquiryCompletionReviewForm({
  inquiryId,
  labels,
}: {
  inquiryId: string;
  labels: {
    title: string;
    ratingLabel: string;
    commentPlaceholder: string;
    submit: string;
    done: string;
  };
}) {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || done) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/inquiry/${inquiryId}/completion-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed");
        return;
      }
      setDone(true);
      toast.success(labels.done);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="text-sm text-emerald-600 dark:text-emerald-400">{labels.done}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{labels.title}</h3>
      <div>
        <label className="text-xs text-zinc-500">{labels.ratingLabel}</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={labels.commentPlaceholder}
        rows={3}
      />
      <Button type="submit" size="sm" disabled={busy}>
        {labels.submit}
      </Button>
    </form>
  );
}
