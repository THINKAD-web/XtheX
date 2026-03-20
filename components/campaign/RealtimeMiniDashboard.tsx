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

  return (
    <section className="space-y-5">
      <div>
        <h2 className="home-solid-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          {isKo ? titleKo : titleEn}
        </h2>
        <p className="home-solid-lead mt-2 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400">
          {isKo
            ? "캠페인 이벤트 테이블 없이도, 오늘 리드(문의) 기반으로 빠른 KPI를 보여줍니다."
            : "Shows quick KPIs from today's leads (inquiries) without a campaign events table."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={isKo ? "오늘 노출" : "Impressions"} value={today.impressions.toLocaleString()} />
        <Kpi label={isKo ? "오늘 클릭" : "Clicks"} value={today.clicks.toLocaleString()} />
        <Kpi label={isKo ? "오늘 리드(문의)" : "Leads"} value={today.leads.toLocaleString()} />
        <Kpi
          label={isKo ? "ROI" : "ROI"}
          value={today.roi == null ? "—" : `${(today.roi * 100).toFixed(1)}%`}
        />
      </div>

      <div className={`${landing.cardDark} p-5`}>
        <h3 className="text-sm font-semibold text-zinc-200">
          {isKo ? "최근 7일 리드(문의) 추이" : "Last 7 days leads"}
        </h3>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series7d} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
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
                dataKey="leads"
                stroke={landingChart.lineAccent}
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

