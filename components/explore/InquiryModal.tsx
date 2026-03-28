"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { ExploreApiItem } from "@/lib/explore/explore-item";
import { usePreferredCurrency } from "@/components/usePreferredCurrency";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import { encryptInquiryPayload } from "@/lib/crypto/inquiry-e2e-browser";
import { E2E_INQUIRY_PLACEHOLDER } from "@/lib/crypto/inquiry-e2e-constants";
import { EncryptionBadge } from "@/components/encryption/EncryptionBadge";

const schema = z.object({
  message: z.string().min(5).max(8000),
  budget: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().nonnegative().optional(),
  ),
  desiredPeriod: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
}).refine((v) => Boolean(v.contactEmail?.trim() || v.contactPhone?.trim()), {
  message: "Provide email or phone",
  path: ["contactEmail"],
});

type FormValues = {
  message: string;
  budget?: number;
  desiredPeriod?: string;
  contactEmail?: string;
  contactPhone?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  medias: ExploreApiItem[] | null;
  locale: string;
  /** Path after locale for post-login return (e.g. `/explore` or `/dashboard/advertiser/explore`). */
  loginCallbackPath?: string;
};

export function InquiryModal({
  open,
  onClose,
  medias,
  locale,
  loginCallbackPath = "/explore",
}: Props) {
  const t = useTranslations("explore.v2.inquiry");
  const { data: session, status } = useSession();
  const preferredCurrency = usePreferredCurrency(locale);
  const [submitting, setSubmitting] = React.useState(false);
  const mediaIds = React.useMemo(() => medias?.map((m) => m.id) ?? [], [medias]);
  const [e2eKeys, setE2eKeys] = React.useState<Record<string, string | null>>({});

  React.useEffect(() => {
    if (!open || mediaIds.length === 0) return;
    let cancelled = false;
    void (async () => {
      const next: Record<string, string | null> = {};
      await Promise.all(
        mediaIds.map(async (id) => {
          try {
            const r = await fetch(`/api/medias/${id}/inquiry-e2e-key`);
            const j = (await r.json()) as { enabled?: boolean; publicKeySpki?: string | null };
            next[id] = r.ok && j.enabled && j.publicKeySpki ? String(j.publicKeySpki) : null;
          } catch {
            next[id] = null;
          }
        }),
      );
      if (!cancelled) setE2eKeys(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mediaIds]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      message: "",
      budget: undefined,
      desiredPeriod: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    const u = session?.user;
    reset({
      message: "",
      budget: undefined,
      desiredPeriod: "",
      contactEmail: u?.email ?? "",
      contactPhone: "",
    });
  }, [open, session?.user, reset]);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !medias || medias.length === 0) return null;

  const titleLine =
    medias.length === 1 ? medias[0]!.title : t("multi_title", { count: medias.length });
  const anyE2e = mediaIds.some((id) => Boolean(e2eKeys[id]));

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const budget =
        typeof values.budget === "number" && !Number.isNaN(values.budget)
          ? Math.round(convertCurrency(values.budget, preferredCurrency, "KRW"))
          : undefined;
      const inputBudget =
        typeof values.budget === "number" && !Number.isNaN(values.budget)
          ? values.budget
          : undefined;

      const contactEmail = values.contactEmail?.trim() || undefined;
      const contactPhone = values.contactPhone?.trim() || undefined;

      const needsEmailForE2e = mediaIds.some((id) => Boolean(e2eKeys[id]));
      if (needsEmailForE2e && !contactEmail) {
        toast.error(t("e2e_need_email"));
        return;
      }

      let sentE2e = false;
      for (const mediaId of mediaIds) {
        const pk = e2eKeys[mediaId];
        let messageOut = values.message.trim();
        let envelope: string | undefined;
        let phoneOut = contactPhone;
        if (pk) {
          envelope = await encryptInquiryPayload(pk, {
            message: values.message.trim(),
            ...(contactPhone ? { contactPhone } : {}),
          });
          messageOut = E2E_INQUIRY_PLACEHOLDER;
          phoneOut = undefined;
          sentE2e = true;
        }
        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId,
            message: messageOut,
            ...(envelope ? { sensitiveEnvelope: envelope } : {}),
            desiredPeriod: values.desiredPeriod?.trim() || undefined,
            budget,
            contactEmail,
            contactPhone: phoneOut,
            locale,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast.error(t("toast_error"), { description: data.error });
          return;
        }
      }

      toast.success(t("toast_ok"), {
        description: [
          sentE2e ? t("e2e_toast") : null,
          budget != null && inputBudget != null
            ? `${formatCurrency(inputBudget, preferredCurrency, locale === "ko" ? "ko-KR" : "en-US")} → ${formatCurrency(budget, "KRW", "ko-KR")} (KRW 저장)`
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      });
      onClose();
    } catch (e) {
      toast.error(t("toast_error"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isGuest = status !== "authenticated";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="inquiry-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="inquiry-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{titleLine}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isGuest ? (
          <div className="space-y-3 rounded-lg border border-sky-200 bg-sky-50/80 p-4 text-sm dark:border-sky-900 dark:bg-sky-950/40">
            <p className="text-zinc-800 dark:text-zinc-200">{t("guest_hint")}</p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(loginCallbackPath)}`}
              className={cn(
                "inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90",
              )}
            >
              {t("guest_login")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {anyE2e ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                <EncryptionBadge label={t("e2e_badge")} className="normal-case tracking-normal" />
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("e2e_hint")}</p>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="inq-contact-email">{t("contact_email")}</Label>
                <Input id="inq-contact-email" type="email" {...register("contactEmail")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inq-contact-phone">{t("contact_phone")}</Label>
                <Input id="inq-contact-phone" {...register("contactPhone")} />
              </div>
            </div>
            {errors.contactEmail && (
              <p className="text-xs text-red-600">{errors.contactEmail.message}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="inq-period">{t("desired_period")}</Label>
                <Input id="inq-period" {...register("desiredPeriod")} placeholder={t("desired_period_ph")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inq-budget">{`${t("budget_krw")} (${preferredCurrency})`}</Label>
                <Input
                  id="inq-budget"
                  type="number"
                  min={0}
                  step={100000}
                  {...register("budget")}
                  placeholder={preferredCurrency === "JPY" ? "1000000" : "10000"}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="inq-msg">{t("message")}</Label>
              <Textarea
                id="inq-msg"
                rows={5}
                {...register("message")}
                placeholder={t("message_ph")}
              />
              {errors.message && (
                <p className="text-xs text-red-600">{errors.message.message}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="min-w-[120px]">
                {submitting ? t("sending") : t("submit")}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
