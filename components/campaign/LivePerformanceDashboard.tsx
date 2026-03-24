"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { landing, landingChart, landingChartLight } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  titleKo?: string;
  titleEn?: string;
  today: {
    impressions: number;
    clicks: number;
    cpm: number | null;
    roi: number | null;
  };
  series: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    cpm: number | null;
  }>;
};

export function LivePerformanceDashboard({
  locale,
  titleKo = "Live Performance Dashboard",
  titleEn = "Live Performance Dashboard",
  today,
  series,
}: Props) {
  const isKo = locale === "ko";
  const isDay = useLandingLightChrome();
  const chart = isDay ? landingChartLight : landingChart;
  const kpiCard = isDay
    ? "rounded-2xl border border-zinc-200 bg-white shadow-md shadow-zinc-200/40"
    : landing.cardDarkCompact;
  const chartCard = isDay
    ? "rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/50"
    : `${landing.cardDark} p-5`;

  return (
    <section className="space-y-5">
      <div>
        <h2
          className={cn(
            "home-solid-heading text-3xl font-bold tracking-tight sm:text-4xl",
            isDay ? "text-zinc-900" : "text-zinc-50",
          )}
        >
          {isKo ? titleKo : titleEn}
        </h2>
        <p
          className={cn(
            "home-solid-lead mt-2 max-w-2xl text-pretty text-base leading-relaxed",
            isDay ? "text-zinc-600" : "text-zinc-400",
          )}
        >
          {isKo
            ? "Prisma aggregate 기반(데모). 5분 주기로 자동 갱신됩니다."
            : "Prisma-aggregated (demo). Auto-refreshes every 5 minutes."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi isDay={isDay} cardClass={kpiCard} label={isKo ? "오늘 노출" : "Impressions"} value={today.impressions.toLocaleString()} />
        <Kpi isDay={isDay} cardClass={kpiCard} label={isKo ? "오늘 클릭" : "Clicks"} value={today.clicks.toLocaleString()} />
        <Kpi
          isDay={isDay}
          cardClass={kpiCard}
          label={isKo ? "CPM" : "CPM"}
          value={today.cpm == null ? "—" : `${Math.round(today.cpm).toLocaleString()}${isKo ? "원" : " KRW"}`}
        />
        <Kpi
          isDay={isDay}
          cardClass={kpiCard}
          label={isKo ? "ROI" : "ROI"}
          value={today.roi == null ? "—" : `${(today.roi * 100).toFixed(1)}%`}
        />
      </div>

      <div className={chartCard}>
        <h3
          className={cn(
            "text-sm font-semibold",
            isDay ? "text-zinc-800" : "text-zinc-200",
          )}
        >
          {isKo ? "최근 7일 노출/클릭 추이" : "Last 7 days impressions/clicks"}
        </h3>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="date" tick={{ fill: chart.axis, fontSize: 11 }} />
              <YAxis tick={{ fill: chart.axis, fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chart.tooltipBg,
                  border: `1px solid ${chart.tooltipBorder}`,
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: isDay ? "#18181b" : "#fafafa" }}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke={chart.linePrimary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke={chart.lineSecondary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={chartCard}>
        <h3
          className={cn(
            "text-sm font-semibold",
            isDay ? "text-zinc-800" : "text-zinc-200",
          )}
        >
          {isKo ? "최근 7일 CPM 추이" : "Last 7 days CPM"}
        </h3>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="date" tick={{ fill: chart.axis, fontSize: 11 }} />
              <YAxis
                tick={{ fill: chart.axis, fontSize: 11 }}
                allowDecimals={false}
                tickFormatter={(v) => v.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chart.tooltipBg,
                  border: `1px solid ${chart.tooltipBorder}`,
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: isDay ? "#18181b" : "#fafafa" }}
                formatter={(value) =>
                  typeof value === "number"
                    ? `${Math.round(value).toLocaleString()}원`
                    : String(value ?? "")
                }
              />
              <Line
                type="monotone"
                dataKey="cpm"
                stroke={chart.lineTertiary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  isDay,
  cardClass,
}: {
  label: string;
  value: string;
  isDay: boolean;
  cardClass: string;
}) {
  return (
    <div className={cn(cardClass, "p-4")}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "home-solid-kpi-val mt-2 text-lg font-semibold tabular-nums",
          isDay ? "text-zinc-900" : "text-zinc-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}

