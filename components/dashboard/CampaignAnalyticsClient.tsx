"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Daily = {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  roiPercent: number | null;
};

type MediaRow = {
  mediaId: string;
  name: string;
  impressions: number;
  clicks: number;
  spend: number;
};

type ApiPayload = {
  ok?: boolean;
  daily?: Daily[];
  totals?: {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    roiPercent: number | null;
  };
  byMedia?: MediaRow[];
  regions?: { code: string; label: string }[];
  medias?: { id: string; name: string }[];
  error?: string;
};

function formatChartDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return `${m}/${d}`;
}

export function CampaignAnalyticsClient() {
  const t = useTranslations("dashboard.campaignAnalytics");
  const [preset, setPreset] = React.useState<"7" | "30" | "90">("30");
  const [region, setRegion] = React.useState("all");
  const [mediaId, setMediaId] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<ApiPayload | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("preset", preset);
      sp.set("region", region);
      if (mediaId && mediaId !== "all") sp.set("mediaId", mediaId);
      const res = await fetch(`/api/dashboard/campaign-analytics?${sp.toString()}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiPayload;
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? t("load_error"));
        setData(null);
        return;
      }
      setData(json);
      if (json.regions?.length) {
        const has = json.regions.some((r) => r.code === region);
        if (!has) setRegion("all");
      }
    } catch {
      toast.error(t("load_error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset, region, mediaId, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const daily = data?.daily ?? [];
  const totals = data?.totals;
  const byMedia = data?.byMedia ?? [];
  const regions = data?.regions ?? [{ code: "all", label: "all" }];
  const medias = data?.medias ?? [];

  React.useEffect(() => {
    if (mediaId === "all") return;
    if (!medias.some((m) => m.id === mediaId)) {
      setMediaId("all");
    }
  }, [medias, mediaId]);

  const chartDaily = daily.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
    roi: d.roiPercent ?? 0,
  }));

  const exportPdf = async () => {
    if (!totals) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 14;
      doc.setFontSize(16);
      doc.text(t("pdf_title"), 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`${t("pdf_period")}: ${preset === "7" ? t("period_7") : preset === "30" ? t("period_30") : t("period_90")}`, 14, y);
      y += 6;
      doc.text(
        `${t("filter_region")}: ${region === "all" ? t("region_all") : region}`,
        14,
        y,
      );
      y += 6;
      doc.text(
        `${t("filter_media")}: ${mediaId === "all" ? t("media_all") : medias.find((m) => m.id === mediaId)?.name ?? mediaId}`,
        14,
        y,
      );
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text(t("pdf_summary"), 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(
        `${t("kpi_impressions")}: ${totals.impressions.toLocaleString()}`,
        14,
        y,
      );
      y += 6;
      doc.text(`${t("kpi_clicks")}: ${totals.clicks.toLocaleString()}`, 14, y);
      y += 6;
      doc.text(`${t("kpi_ctr")}: ${totals.ctr}%`, 14, y);
      y += 6;
      doc.text(`${t("kpi_spend")}: ${totals.spend.toLocaleString()} ${t("currency_krw")}`, 14, y);
      y += 6;
      doc.text(
        `${t("kpi_roi")}: ${totals.roiPercent == null ? "—" : `${totals.roiPercent}%`}`,
        14,
        y,
      );
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text(t("pdf_daily_table"), 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      for (const row of daily) {
        if (y > 280) {
          doc.addPage();
          y = 14;
        }
        doc.text(
          `${row.date}  ${row.impressions}  ${row.clicks}  ${row.ctr}%  ${row.spend}  ${row.roiPercent ?? "—"}`,
          14,
          y,
        );
        y += 5;
      }
      doc.setFontSize(9);
      y += 4;
      if (y > 250) {
        doc.addPage();
        y = 14;
      }
      doc.setFont("helvetica", "bold");
      doc.text(t("pdf_footer_note"), 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(t("pdf_roi_note"), 14, y);

      doc.save(`xthex-campaign-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t("pdf_done"));
    } catch {
      toast.error(t("pdf_error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("filter_period")}</p>
            <Select value={preset} onValueChange={(v) => setPreset(v as typeof preset)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t("period_7")}</SelectItem>
                <SelectItem value="30">{t("period_30")}</SelectItem>
                <SelectItem value="90">{t("period_90")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("filter_region")}</p>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.code === "all" ? t("region_all") : r.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-[200px] flex-1">
            <p className="text-xs font-medium text-muted-foreground">{t("filter_media")}</p>
            <Select value={mediaId} onValueChange={setMediaId}>
              <SelectTrigger className="w-full min-w-[200px]">
                <SelectValue placeholder={t("media_all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("media_all")}</SelectItem>
                {medias.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {t("refresh")}
          </Button>
          <Button type="button" size="sm" onClick={exportPdf} disabled={loading || !totals}>
            <FileDown className="mr-2 h-4 w-4" />
            {t("pdf_button")}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : totals ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("kpi_impressions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{totals.impressions.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("kpi_ctr")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{totals.ctr}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("kpi_spend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {totals.spend.toLocaleString()} <span className="text-base font-normal">{t("currency_krw")}</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("kpi_roi")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {totals.roiPercent == null ? "—" : `${totals.roiPercent}%`}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">{t("chart_impressions_clicks")}</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDaily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} width={44} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={40} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="impressions"
                      name={t("legend_impressions")}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="clicks"
                      name={t("legend_clicks")}
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">{t("chart_ctr_roi")}</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDaily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} width={40} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={44} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ctr"
                      name={t("legend_ctr")}
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="roi"
                      name={t("legend_roi")}
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {byMedia.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">{t("chart_by_media")}</CardTitle>
                <p className="text-xs text-muted-foreground">{t("by_media_hint")}</p>
              </CardHeader>
              <CardContent className="h-[320px] pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byMedia.slice(0, 12).map((m) => ({
                      name: m.name.length > 18 ? `${m.name.slice(0, 18)}…` : m.name,
                      impressions: m.impressions,
                    }))}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t("table_daily")}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 sm:p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("col_date")}</TableHead>
                    <TableHead className="text-right">{t("col_impressions")}</TableHead>
                    <TableHead className="text-right">{t("col_clicks")}</TableHead>
                    <TableHead className="text-right">{t("col_ctr")}</TableHead>
                    <TableHead className="text-right">{t("col_spend")}</TableHead>
                    <TableHead className="text-right">{t("col_roi")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daily.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {t("empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    daily.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-mono text-sm">{row.date}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.impressions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.ctr}%</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.spend.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.roiPercent == null ? "—" : `${row.roiPercent}%`}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
