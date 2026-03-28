"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquarePlus, Star, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export function FeedbackWidget() {
  const t = useTranslations("feedback");
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setOpen(false);
    setRating(0);
    setHovered(0);
    setMessage("");
    setDone(false);
  };

  const submit = async () => {
    if (rating < 1) {
      toast.error(t("rating_required"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message: message.trim() || null }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        toast.error(t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button — bottom-left */}
      <button
        type="button"
        onClick={() => (open ? reset() : setOpen(true))}
        className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label={t("button_label")}
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed bottom-20 left-6 z-50 w-[340px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
          {done ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("thank_you")}
              </p>
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t("thank_you_sub")}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {t("close")}
              </button>
            </div>
          ) : (
            <div className="px-5 py-5">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {t("title")}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t("subtitle")}
              </p>

              {/* Stars */}
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                    aria-label={`${n} star`}
                  >
                    <Star
                      className={`h-7 w-7 ${
                        n <= (hovered || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300 dark:text-zinc-600"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("placeholder")}
                className="mt-4 h-24 w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                maxLength={2000}
              />

              <button
                type="button"
                disabled={sending || rating < 1}
                onClick={submit}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("submit")
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
