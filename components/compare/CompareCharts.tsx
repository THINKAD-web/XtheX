"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

type MediaForChart = {
  id: string;
  mediaName: string;
  price: number | null;
  cpm: number | null;
  trustScore: number | null;
  exposureJson?: unknown;
  pros?: string | null;
};

type Props = {
  medias: MediaForChart[];
  locale: string;
  className?: string;
};

function parseExposureNumber(exp: unknown, key: string): number | null {
  if (exp == null || typeof exp !== "object") return null;
  const v = (exp as any)[key];
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/** 장점 텍스트 길이로 간단 점수 (0~100) */
function prosScore(pros: string | null | undefined): number {
  if (!pros || !pros.trim()) return 0;
  const len = pros.trim().length;
  return Math.min(100, Math.round(len / 2));
}

export function CompareCharts({ medias, locale, className }: Props) {
  const isKo = locale === "ko";

  const barData = React.useMemo(() => {
    return medias.map((m) => {
      const exp = m.exposureJson as any;
      const monthly = parseExposureNumber(exp, "monthly_impressions") ?? parseExposureNumber(exp, "daily_traffic") ?? 0;
      return {
        name: m.mediaName.length > 8 ? m.mediaName.slice(0, 8) + "…" : m.mediaName,
        fullName: m.mediaName,
        cpm: m.cpm ?? 0,
        trust: m.trustScore ?? 0,
        exposure: monthly,
      };
    });
  }, [medias]);

  const radarData = React.useMemo(() => {
    const maxPrice = Math.max(...medias.map((m) => m.price ?? 0), 1);
    const maxCpm = Math.max(...medias.map((m) => m.cpm ?? 0), 1);
    const maxExp = Math.max(
      ...medias.map((m) => parseExposureNumber(m.exposureJson as any, "monthly_impressions") ?? 0),
      1,
    );

    const subjects = [
      { key: "price", labelKo: "가격↑", labelEn: "Price" },
      { key: "trust", labelKo: "신뢰도", labelEn: "Trust" },
      { key: "exposure", labelKo: "노출", labelEn: "Exposure" },
      { key: "cpm", labelKo: "CPM↑", labelEn: "CPM" },
      { key: "pros", labelKo: "장점", labelEn: "Pros" },
    ];

    return subjects.map((sub) => {
      const row: Record<string, string | number> = {
        subject: isKo ? sub.labelKo : sub.labelEn,
      };
      medias.forEach((m, i) => {
        const exp = parseExposureNumber(m.exposureJson as any, "monthly_impressions") ?? 0;
        const priceScore = maxPrice > 0 && m.price != null ? Math.round(100 - (m.price / maxPrice) * 100) : 0;
        const trustScore = m.trustScore ?? 0;
        const exposureScore = maxExp > 0 ? Math.round(Math.min(100, (exp / maxExp) * 100)) : 0;
        const cpmScore = maxCpm > 0 && m.cpm != null ? Math.round(100 - (m.cpm / maxCpm) * 100) : 0;
        const prosScoreVal = prosScore(m.pros);
        const val =
          sub.key === "price" ? priceScore
          : sub.key === "trust" ? trustScore
          : sub.key === "exposure" ? exposureScore
          : sub.key === "cpm" ? cpmScore
          : prosScoreVal;
        row[`m${i}`] = val;
      });
      return row;
    });
  }, [medias, isKo]);

  return (
    <section className={cn("space-y-6", className)}>
      <h2 className="text-sm font-semibold text-zinc-900">
        {isKo ? "비교 차트" : "Comparison charts"}
      </h2>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {isKo ? "CPM · 신뢰도 · 노출" : "CPM · Trust · Exposure"}
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "#52525b", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#52525b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e4e4e7" }}
                labelStyle={{ color: "#18181b" }}
                formatter={(value, name) => {
                  const n = typeof value === "number" ? value : Number(value ?? 0);
                  return [
                    name === "exposure" ? n.toLocaleString() : (value ?? ""),
                    name === "cpm" ? "CPM" : name === "trust" ? (isKo ? "신뢰도" : "Trust") : (isKo ? "노출" : "Exposure"),
                  ];
                }}
                labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ""}
              />
              <Bar yAxisId="left" dataKey="cpm" fill="#f97316" radius={[4, 4, 0, 0]} name="cpm" />
              <Bar yAxisId="left" dataKey="trust" fill="#22c55e" radius={[4, 4, 0, 0]} name="trust" />
              <Bar yAxisId="right" dataKey="exposure" fill="#3b82f6" radius={[4, 4, 0, 0]} name="exposure" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {isKo ? "종합 레이더 (가격·신뢰·노출·CPM·장점)" : "Radar: Price · Trust · Exposure · CPM · Pros"}
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#d4d4d8" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#52525b", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#71717a" }} />
              {medias.map((m, i) => (
                <Radar
                  key={m.id}
                  name={m.mediaName.length > 12 ? m.mediaName.slice(0, 12) + "…" : m.mediaName}
                  dataKey={`m${i}`}
                  stroke={["#f97316", "#22c55e", "#3b82f6"][i % 3]}
                  fill={["#f97316", "#22c55e", "#3b82f6"][i % 3]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
