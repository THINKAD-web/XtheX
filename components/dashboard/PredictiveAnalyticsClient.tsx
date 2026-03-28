"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bell, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { MediaCategory } from "@prisma/client";
import type { PredictiveAnalyticsPayload } from "@/lib/predictive/build-predictive-analytics";

type ApiPayload = { ok?: boolean; data?: PredictiveAnalyticsPayload; error?: string };

const REASON_KEYS = [
  "history_region",
  "history_category",
  "seasonal_tailwind",
  "platform_momentum",
] as const;

export function PredictiveAnalyticsClient() {
  const t = useTranslations("dashboard.predictiveAnalytics");
  const locale = useLocale();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<PredictiveAnalyticsPayload | null>(null);
  const [notifyBusy, setNotifyBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("locale", locale);
      const res = await fetch(`/api/dashboard/predictive-analytics?${sp.toString()}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiPayload;
      if (!res.ok || !json.ok || !json.data) {
        toast.error(json.error ?? t("load_error"));
        setData(null);
        return;
      }
      setData(json.data);
    } catch {
      toast.error(t("load_error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const sendNotify = React.useCallback(async () => {
    setNotifyBusy(true);
    try {
      const res = await fetch("/api/dashboard/predictive-notify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.status === 429 && json.error === "rate_limited") {
        toast.message(t("notify_rate"));
        return;
      }
      if (res.status === 403 && json.error === "notifications_disabled") {
        toast.message(t("notify_muted"));
        return;
      }
      if (!res.ok || !json.ok) {
        toast.error(t("notify_err"));
        return;
      }
      toast.success(t("notify_ok"));
    } catch {
      toast.error(t("notify_err"));
    } finally {
      setNotifyBusy(false);
    }
  }, [locale, t]);

  const catLabel = (c: MediaCategory) =>
    t(`categories.${c}` as Parameters<typeof t>[0]);

  const reasonLabel = (key: string) => {
    if (REASON_KEYS.includes(key as (typeof REASON_KEYS)[number])) {
      return t(`reason_${key}` as Parameters<typeof t>[0]);
    }
    return key;
  };

  const seasonalTag = (k: string) => {
    if (k === "high") return t("seasonal_tag_high");
    if (k === "low") return t("seasonal_tag_low");
    return t("seasonal_tag_mid");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          {t("refresh")}
        </Button>
        <Button type="button" size="sm" onClick={() => void sendNotify()} disabled={notifyBusy || loading}>
          <Bell className="mr-2 h-4 w-4" />
          {t("notify_cta")}
        </Button>
      </div>

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">{t("load_error")}</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("history_wishlist")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {data.history.wishlistCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("history_inquiry")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {data.history.inquiryCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("history_campaign")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {data.history.campaignCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("current_month")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {data.seasonal.currentMonthDemand.toFixed(2)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("history_title")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.history.hasStrongSignal ? t("history_signal_strong") : t("history_signal_light")}
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("seasonal_title")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.seasonal.hemisphereHint === "south" ? t("hemisphere_south") : t("hemisphere_north")}
                {" · "}
                {t("seasonal_sub")}
              </p>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.seasonal.months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={["auto", "auto"]} width={36} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="demandIndex"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name={t("chart_demand")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("regional_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.regional} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                    <YAxis width={36} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="blendedScore"
                      fill="hsl(var(--primary))"
                      name={t("col_blend")}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("col_country")}</TableHead>
                    <TableHead className="text-right">{t("col_platform_share")}</TableHead>
                    <TableHead className="text-right">{t("col_affinity")}</TableHead>
                    <TableHead className="text-right">{t("col_blend")}</TableHead>
                    <TableHead>{t("col_season_note")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.regional.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        —
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.regional.map((r) => (
                      <TableRow key={r.code}>
                        <TableCell className="font-medium">{r.code}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.sharePercent}%</TableCell>
                        <TableCell className="text-right tabular-nums">{r.userAffinity}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.blendedScore}</TableCell>
                        <TableCell>{seasonalTag(r.seasonalNoteKey)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("picks_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("col_name")}</TableHead>
                    <TableHead>{t("col_cat")}</TableHead>
                    <TableHead>{t("col_region")}</TableHead>
                    <TableHead className="text-right">{t("col_score")}</TableHead>
                    <TableHead>{t("col_reasons")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.picks.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/medias/${p.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>{catLabel(p.category)}</TableCell>
                      <TableCell>{p.country ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.score}</TableCell>
                      <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                        {p.reasonKeys.map((k) => reasonLabel(k)).join(" · ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
