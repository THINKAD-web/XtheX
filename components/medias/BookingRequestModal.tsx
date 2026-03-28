"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarCheck } from "lucide-react";
import { encryptInquiryPayload } from "@/lib/crypto/inquiry-e2e-browser";
import { E2E_INQUIRY_PLACEHOLDER } from "@/lib/crypto/inquiry-e2e-constants";
import { EncryptionBadge } from "@/components/encryption/EncryptionBadge";

interface BookingRequestModalProps {
  mediaId: string;
  mediaName: string;
  locale: string;
  labels: {
    bookNow: string;
    title: string;
    campaignPeriod: string;
    startDate: string;
    endDate: string;
    budget: string;
    notes: string;
    notesPlaceholder: string;
    submit: string;
    success: string;
    error: string;
    loginRequired: string;
    contactEmail: string;
    e2eReady?: string;
  };
}

export function BookingRequestModal({
  mediaId,
  mediaName,
  locale,
  labels,
}: BookingRequestModalProps) {
  const [open, setOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [e2ePk, setE2ePk] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(`/api/medias/${mediaId}/inquiry-e2e-key`);
        const j = (await r.json()) as { enabled?: boolean; publicKeySpki?: string | null };
        if (!cancelled && r.ok && j.enabled && j.publicKeySpki) {
          setE2ePk(String(j.publicKeySpki));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("loading");

      const period = startDate && endDate ? `${startDate} ~ ${endDate}` : undefined;

      try {
        const plainMessage =
          `[Booking Request] ${mediaName}\n${labels.campaignPeriod}: ${period ?? "N/A"}\n${labels.budget}: ${budget || "N/A"}\n\n${notes}`.trim();
        let messageOut = plainMessage;
        let envelope: string | undefined;
        if (e2ePk) {
          if (!email.trim()) {
            setStatus("error");
            return;
          }
          envelope = await encryptInquiryPayload(e2ePk, { message: plainMessage });
          messageOut = E2E_INQUIRY_PLACEHOLDER;
        }
        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId,
            message: messageOut,
            ...(envelope ? { sensitiveEnvelope: envelope } : {}),
            desiredPeriod: period,
            budget: budget ? parseInt(budget, 10) : undefined,
            contactEmail: email || undefined,
            locale,
          }),
        });

        if (res.status === 403) {
          setStatus("error");
          alert(labels.loginRequired);
          return;
        }

        if (!res.ok) throw new Error("Request failed");
        setStatus("success");
      } catch {
        setStatus("error");
      }
    },
    [mediaId, mediaName, startDate, endDate, budget, notes, email, locale, labels, e2ePk],
  );

  const resetAndClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setStartDate("");
      setEndDate("");
      setBudget("");
      setNotes("");
      setEmail("");
    }, 300);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
      >
        <CalendarCheck className="h-4 w-4" />
        {labels.bookNow}
      </button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">{labels.title}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {mediaName}
            </DialogDescription>
          </DialogHeader>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <p className="text-sm text-emerald-300">{labels.success}</p>
              <button
                onClick={resetAndClose}
                className="mt-2 rounded-full border border-zinc-700 px-6 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                OK
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {e2ePk && labels.e2eReady ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
                  <EncryptionBadge label="E2E" className="normal-case tracking-normal" />
                  <p className="text-[11px] text-emerald-100/90">{labels.e2eReady}</p>
                </div>
              ) : null}
              {/* Campaign Period */}
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-zinc-400">
                  {labels.campaignPeriod}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-zinc-500">
                      {labels.startDate}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-zinc-500">
                      {labels.endDate}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      min={startDate || undefined}
                      className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Budget */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  {labels.budget}
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="0"
                  placeholder="5,000,000"
                  className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  {labels.contactEmail}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  {labels.notes}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={labels.notesPlaceholder}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-400">{labels.error}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="flex h-10 w-full items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {status === "loading" ? "..." : labels.submit}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
