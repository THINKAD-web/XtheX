"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, MapPin, Star } from "lucide-react";
import { landingChart } from "@/lib/landing-theme";

const MOCK_ROI_DATA = [
  { name: "Q1", roi: 120 },
  { name: "Q2", roi: 185 },
  { name: "Q3", roi: 210 },
  { name: "Q4", roi: 260 },
];

function generateMonthlyData(t: ReturnType<typeof useTranslations<"analytics">>) {
  const months = [
    t("month_jan"), t("month_feb"), t("month_mar"), t("month_apr"),
    t("month_may"), t("month_jun"), t("month_jul"), t("month_aug"),
    t("month_sep"), t("month_oct"), t("month_nov"), t("month_dec"),
  ];
  return months.map((m, i) => ({
    month: m,
    spend: Math.round(200 + Math.random() * 600),
    impressions: Math.round(50 + Math.random() * 400),
  }));
}

const MOCK_REGIONAL_DATA = [
  { region: "강남/서초", impressions: 4200 },
  { region: "홍대/마포", impressions: 3800 },
  { region: "명동/중구", impressions: 3100 },
  { region: "잠실/송파", impressions: 2400 },
  { region: "여의도", impressions: 1900 },
  { region: "신촌/연대", impressions: 1600 },
];

const MOCK_TOP_MEDIA = [
  { name: "강남역 디지털 빌보드", inquiries: 48, views: 2340 },
  { name: "홍대입구 전광판", inquiries: 35, views: 1890 },
  { name: "명동 LED 사이니지", inquiries: 29, views: 1560 },
  { name: "코엑스 디지털 월", inquiries: 22, views: 1230 },
  { name: "여의도 버스쉘터", inquiries: 18, views: 980 },
];

const chartTooltipStyle = {
  backgroundColor: landingChart.tooltipBg,
  border: `1px solid ${landingChart.tooltipBorder}`,
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

export function AdvertiserAnalyticsSection() {
  const t = useTranslations("analytics");
  const monthlyData = generateMonthlyData(t);

  return (
    <section className="space-y-6" aria-labelledby="analytics-section-title">
      <h2
        id="analytics-section-title"
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
      >
        {t("section_title")}
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ROI Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {t("roi_title")}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_ROI_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={landingChart.grid} />
              <XAxis dataKey="name" stroke={landingChart.axis} fontSize={12} />
              <YAxis stroke={landingChart.axis} fontSize={12} unit="%" />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar
                dataKey="roi"
                name={t("roi_label")}
                fill={landingChart.linePrimary}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Spend / Impressions */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {t("monthly_title")}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={landingChart.grid} />
              <XAxis dataKey="month" stroke={landingChart.axis} fontSize={11} />
              <YAxis stroke={landingChart.axis} fontSize={12} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="spend"
                name={t("spend_label")}
                stroke={landingChart.linePrimary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                name={t("impressions_label")}
                stroke={landingChart.lineSecondary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Regional distribution */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {t("regional_title")}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_REGIONAL_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={landingChart.grid} />
              <XAxis type="number" stroke={landingChart.axis} fontSize={12} />
              <YAxis
                type="category"
                dataKey="region"
                stroke={landingChart.axis}
                fontSize={11}
                width={80}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar
                dataKey="impressions"
                name={t("regional_impressions")}
                fill={landingChart.lineSecondary}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Media */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {t("top_media_title")}
            </h3>
          </div>
          <ul className="space-y-3">
            {MOCK_TOP_MEDIA.map((media, idx) => (
              <li
                key={media.name}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-500">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {media.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {t("top_media_inquiries")} {media.inquiries} · {t("top_media_views")} {media.views.toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
