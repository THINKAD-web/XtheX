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
import { landing, landingChart } from "@/lib/landing-theme";

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

  return (
    <section className="space-y-5">
      <div>
        <h2 className="home-solid-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          {isKo ? titleKo : titleEn}
        </h2>
        <p className="home-solid-lead mt-2 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400">
          {isKo
            ? "Prisma aggregate 기반(데모). 5분 주기로 자동 갱신됩니다."
            : "Prisma-aggregated (demo). Auto-refreshes every 5 minutes."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={isKo ? "오늘 노출" : "Impressions"} value={today.impressions.toLocaleString()} />
        <Kpi label={isKo ? "오늘 클릭" : "Clicks"} value={today.clicks.toLocaleString()} />
        <Kpi
          label={isKo ? "CPM" : "CPM"}
          value={today.cpm == null ? "—" : `${Math.round(today.cpm).toLocaleString()}${isKo ? "원" : " KRW"}`}
        />
        <Kpi
          label={isKo ? "ROI" : "ROI"}
          value={today.roi == null ? "—" : `${(today.roi * 100).toFixed(1)}%`}
        />
      </div>

      <div className={`${landing.cardDark} p-5`}>
        <h3 className="text-sm font-semibold text-zinc-200">
          {isKo ? "최근 7일 노출/클릭 추이" : "Last 7 days impressions/clicks"}
        </h3>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={landingChart.grid} />
              <XAxis dataKey="date" tick={{ fill: landingChart.axis, fontSize: 11 }} />
              <YAxis tick={{ fill: landingChart.axis, fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: landingChart.tooltipBg,
                  border: `1px solid ${landingChart.tooltipBorder}`,
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#fafafa" }}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke={landingChart.linePrimary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke={landingChart.lineSecondary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${landing.cardDark} p-5`}>
        <h3 className="text-sm font-semibold text-zinc-200">
          {isKo ? "최근 7일 CPM 추이" : "Last 7 days CPM"}
        </h3>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={landingChart.grid} />
              <XAxis dataKey="date" tick={{ fill: landingChart.axis, fontSize: 11 }} />
              <YAxis
                tick={{ fill: landingChart.axis, fontSize: 11 }}
                allowDecimals={false}
                tickFormatter={(v) => v.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: landingChart.tooltipBg,
                  border: `1px solid ${landingChart.tooltipBorder}`,
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#fafafa" }}
                formatter={(value) =>
                  typeof value === "number"
                    ? `${Math.round(value).toLocaleString()}원`
                    : String(value ?? "")
                }
              />
              <Line
                type="monotone"
                dataKey="cpm"
                stroke={landingChart.lineTertiary}
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${landing.cardDarkCompact} p-4`}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="home-solid-kpi-val mt-2 text-lg font-semibold tabular-nums text-zinc-50">
        {value}
      </p>
    </div>
  );
}

