"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Users,
  CalendarRange,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { landingChart, landingChartLight } from "@/lib/landing-theme";
import { cn } from "@/lib/utils";

export type AnalyticsPeriod = "7d" | "30d";

type DailyRow = {
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  responseRate: number;
};

type PieRow = {
  name: string;
  value: number;
  key: "digital" | "billboard" | "transit" | "other";
};

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDataset(period: AnalyticsPeriod, localeKey: string): {
  daily: DailyRow[];
  pie: PieRow[];
  totals: { impressions: number; reach: number; clicks: number; avgResponse: number };
} {
  const days = period === "7d" ? 7 : 30;
  const seed = days * 17 + localeKey.length * 31;
  const rnd = mulberry32(seed);
  const now = new Date();
  const daily: DailyRow[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayWave = 0.85 + Math.sin((days - i) * 0.35 + seed * 0.01) * 0.12;
    const noise = 0.92 + rnd() * 0.16;
    const base = period === "7d" ? 42_000 : 28_000;
    const impressions = Math.round(base * dayWave * noise);
    const reach = Math.round(impressions * (0.58 + rnd() * 0.12));
    const clicks = Math.round(impressions * (0.018 + rnd() * 0.022));
    const responseRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    daily.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      impressions,
      reach,
      clicks,
      responseRate: Number(responseRate.toFixed(2)),
    });
  }

  const impressions = daily.reduce((s, r) => s + r.impressions, 0);
  const reach = daily.reduce((s, r) => s + r.reach, 0);
  const clicks = daily.reduce((s, r) => s + r.clicks, 0);
  const avgResponse =
    impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

  const p1 = 34 + Math.floor(rnd() * 8);
  const p2 = 24 + Math.floor(rnd() * 6);
  const p3 = 18 + Math.floor(rnd() * 5);
  const p4 = 100 - p1 - p2 - p3;
  const pie: PieRow[] = [
    { key: "digital", name: "digital", value: p1 },
    { key: "billboard", name: "billboard", value: p2 },
    { key: "transit", name: "transit", value: p3 },
    { key: "other", name: "other", value: Math.max(4, p4) },
  ];

  return { daily, pie, totals: { impressions, reach, clicks, avgResponse } };
}

const PIE_COLORS = ["#6366f1", "#22d3ee", "#34d399", "#fbbf24"];

const PIE_MSG: Record<
  PieRow["key"],
  "pie_digital" | "pie_billboard" | "pie_transit" | "pie_other"
> = {
  digital: "pie_digital",
  billboard: "pie_billboard",
  transit: "pie_transit",
  other: "pie_other",
};

function formatCompact(n: number, locale: string): string {
  if (locale.startsWith("ko")) {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
    if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString(locale)}만`;
    return n.toLocaleString(locale);
  }
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(locale);
}

export function CampaignAnalyticsTool() {
  const t = useTranslations("campaignAnalytics");
  const params = useParams();
  const locale = (params?.locale as string) ?? "ko";
  const { resolvedTheme } = useTheme();
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("7d");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chart = mounted && resolvedTheme === "dark" ? landingChart : landingChartLight;

  const { daily, pie, totals } = React.useMemo(
    () => buildDataset(period, locale),
    [period, locale],
  );

  const pieWithLabels = React.useMemo(
    () =>
      pie.map((p) => ({
        ...p,
        name: t(PIE_MSG[p.key]),
      })),
    [pie, t],
  );

  const tooltipStyle = React.useMemo(
    () => ({
      backgroundColor: chart.tooltipBg,
      border: `1px solid ${chart.tooltipBorder}`,
      borderRadius: 8,
      fontSize: 12,
      color: resolvedTheme === "dark" ? "#fafafa" : "#18181b",
    }),
    [chart, resolvedTheme],
  );

  const renderPieLabel = React.useCallback((props: PieLabelRenderProps) => {
    const { name, percent } = props;
    if (percent == null || name == null) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  }, []);

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-violet-600 dark:text-violet-300">
          <BarChart3 className="h-5 w-5" aria-hidden />
          <span className="font-semibold uppercase tracking-wider">{t("kicker")}</span>
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-pretty text-zinc-600 dark:text-zinc-400">{t("lead")}</p>
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {t("demo_notice")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <CalendarRange className="h-4 w-4" aria-hidden />
          {t("period_label")}
        </span>
        <Button
          type="button"
          variant={period === "7d" ? "default" : "outline"}
          size="sm"
          className={cn(period === "7d" && "bg-violet-600 hover:bg-violet-600/90")}
          onClick={() => setPeriod("7d")}
        >
          {t("period_week")}
        </Button>
        <Button
          type="button"
          variant={period === "30d" ? "default" : "outline"}
          size="sm"
          className={cn(period === "30d" && "bg-violet-600 hover:bg-violet-600/90")}
          onClick={() => setPeriod("30d")}
        >
          {t("period_month")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {t("kpi_reach")}
            </CardTitle>
            <Users className="h-4 w-4 text-violet-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatCompact(totals.reach, locale)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("kpi_reach_hint")}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {t("kpi_impressions")}
            </CardTitle>
            <Eye className="h-4 w-4 text-sky-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatCompact(totals.impressions, locale)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("kpi_impressions_hint")}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {t("kpi_response")}
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-emerald-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {totals.avgResponse}%
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("kpi_response_hint")}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {t("kpi_engagements")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-amber-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {totals.clicks.toLocaleString(locale)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("kpi_engagements_hint")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">{t("chart_line_title")}</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("chart_line_sub")}</p>
          </CardHeader>
          <CardContent className="h-[320px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="date" stroke={chart.axis} fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke={chart.axis}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(Number(v), locale)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={chart.axis}
                  fontSize={11}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  name={t("series_impressions")}
                  stroke={chart.linePrimary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="reach"
                  name={t("series_reach")}
                  stroke={chart.lineSecondary}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="responseRate"
                  name={t("series_response")}
                  stroke={chart.lineTertiary}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t("chart_pie_title")}</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("chart_pie_sub")}</p>
          </CardHeader>
          <CardContent className="h-[320px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieWithLabels}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={2}
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {pieWithLabels.map((_, i) => (
                    <Cell key={pieWithLabels[i].key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90">
        <CardHeader>
          <CardTitle className="text-lg">{t("table_title")}</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("table_sub")}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="text-zinc-700 dark:text-zinc-300">{t("col_date")}</TableHead>
                <TableHead className="text-right text-zinc-700 dark:text-zinc-300">
                  {t("col_impressions")}
                </TableHead>
                <TableHead className="text-right text-zinc-700 dark:text-zinc-300">
                  {t("col_reach")}
                </TableHead>
                <TableHead className="text-right text-zinc-700 dark:text-zinc-300">
                  {t("col_clicks")}
                </TableHead>
                <TableHead className="text-right text-zinc-700 dark:text-zinc-300">
                  {t("col_response")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((row) => (
                <TableRow
                  key={row.date}
                  className="border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {row.impressions.toLocaleString(locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {row.reach.toLocaleString(locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {row.clicks.toLocaleString(locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {row.responseRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
