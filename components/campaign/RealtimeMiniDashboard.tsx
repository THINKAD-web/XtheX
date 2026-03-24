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
  today: { impressions: number; clicks: number; leads: number; roi: number | null };
  series7d: Array<{ date: string; leads: number }>;
};

export function RealtimeMiniDashboard({
  locale,
  titleKo = "실시간 성과 (데모)",
  titleEn = "Realtime performance (demo)",
  today,
  series7d,
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
            ? "캠페인 이벤트 테이블 없이도, 오늘 리드(문의) 기반으로 빠른 KPI를 보여줍니다."
            : "Shows quick KPIs from today's leads (inquiries) without a campaign events table."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi isDay={isDay} cardClass={kpiCard} label={isKo ? "오늘 노출" : "Impressions"} value={today.impressions.toLocaleString()} />
        <Kpi isDay={isDay} cardClass={kpiCard} label={isKo ? "오늘 클릭" : "Clicks"} value={today.clicks.toLocaleString()} />
        <Kpi isDay={isDay} cardClass={kpiCard} label={isKo ? "오늘 리드(문의)" : "Leads"} value={today.leads.toLocaleString()} />
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
          {isKo ? "최근 7일 리드(문의) 추이" : "Last 7 days leads"}
        </h3>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series7d} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
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
                dataKey="leads"
                stroke={chart.lineAccent}
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
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          isDay ? "text-zinc-500" : "text-zinc-500",
        )}
      >
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

