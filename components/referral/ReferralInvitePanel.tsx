"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gift, Share2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routing } from "@/i18n/routing";

type ReferralPayload = {
  ok: true;
  code: string;
  creditPoints: number;
  invitedCount: number;
  referrerBonusPoints: number;
  refereeBonusPoints: number;
};

export function ReferralInvitePanel() {
  const t = useTranslations("referral");
  const locale = useLocale();
  const [data, setData] = React.useState<ReferralPayload | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/referral", { credentials: "include" });
        const json = (await res.json()) as ReferralPayload | { error?: string };
        if (!cancelled && res.ok && "ok" in json && json.ok) {
          setData(json);
        } else if (!cancelled) {
          setData(null);
          toast.error(t("load_error"));
        }
      } catch {
        if (!cancelled) {
          setData(null);
          toast.error(t("load_error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const inviteUrl = React.useMemo(() => {
    if (!data?.code || typeof window === "undefined") return "";
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return `${window.location.origin}${prefix}/signup?ref=${encodeURIComponent(data.code)}`;
  }, [data?.code, locale]);

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t("toast_copied"));
    } catch {
      toast.error(t("toast_share_failed"));
    }
  };

  const share = async () => {
    if (!inviteUrl || !data) return;
    const payload = {
      title: t("share_title"),
      text: t("share_body", { code: data.code }),
      url: inviteUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        toast.success(t("toast_shared"));
        return;
      }
      await copyLink();
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await copyLink();
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
        {t("loading")}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("section_title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("section_subtitle")}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("bonus_hint", {
          refereePts: data.refereeBonusPoints,
          referrerPts: data.referrerBonusPoints,
        })}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{t("credit_balance")}</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{data.creditPoints}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{t("invited_count")}</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{data.invitedCount}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="referral-code-display">
          {t("your_code")}
        </label>
        <Input
          id="referral-code-display"
          readOnly
          value={data.code}
          className="font-mono text-base tracking-wider"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="gap-2 sm:flex-1" onClick={copyLink}>
          <Link2 className="h-4 w-4" aria-hidden />
          {t("copy_link")}
        </Button>
        <Button type="button" className="gap-2 sm:flex-1" onClick={share}>
          <Share2 className="h-4 w-4" aria-hidden />
          {t("share")}
        </Button>
      </div>
    </section>
  );
}
