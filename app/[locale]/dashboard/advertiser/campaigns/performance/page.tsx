"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { landing, landingChart } from "@/lib/landing-theme";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  TrendingUp,
  MapPin,
  Eye,
  Users,
  ArrowLeft,
  BarChart3,
  Loader2,
} from "lucide-react";
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

type Campaign = {
  id: string;
  title: string | null;
  status: string;
  budget_krw: number;
  duration_weeks: number;
  createdAt: string;
};

type PerformanceData = {
  daily: { date: string; impressions: number; clicks: number }[];
  regions: { name: string; value: number }[];
  summary: { impressions: number; reach: number; ctr: number };
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  APPROVED: {
    label: "진행중",
    cls: "border-emerald-500 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  SUBMITTED: {
    label: "예정",
    cls: "border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100",
  },
  DRAFT: {
    label: "예정",
    cls: "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  },
  REJECTED: {
    label: "완료",
    cls: "border-red-400 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100",
  },
};

const PIE_COLORS = ["#3b82f6", "#22d3ee", "#818cf8", "#f59e0b", "#10b981", "#ef4444"];

function generateMockPerformance(campaign: Campaign): PerformanceData {
  const seed = campaign.id.charCodeAt(0) + campaign.budget_krw;
  const days = campaign.duration_weeks * 7;
  const baseDailyImpressions = Math.round(campaign.budget_krw / days / 5);

  const daily = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date(campaign.createdAt);
    d.setDate(d.getDate() + i);
    const variance = 0.7 + Math.sin(seed + i * 0.5) * 0.3 + Math.random() * 0.3;
    const impressions = Math.round(baseDailyImpressions * variance);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      impressions,
      clicks: Math.round(impressions * (0.02 + Math.random() * 0.03)),
    };
  });

  const regions = [
    { name: "강남/서초", value: 32 + (seed % 10) },
    { name: "종로/중구", value: 22 + (seed % 8) },
    { name: "마포/홍대", value: 18 + (seed % 6) },
    { name: "영등포/여의도", value: 14 + (seed % 5) },
    { name: "성수/건대", value: 10 + (seed % 4) },
    { name: "기타", value: 4 + (seed % 3) },
  ];

  const totalImpressions = daily.reduce((s, d) => s + d.impressions, 0);
  return {
    daily,
    regions,
    summary: {
      impressions: totalImpressions,
      reach: Math.round(totalImpressions * 0.65),
      ctr: Number((daily.reduce((s, d) => s + d.clicks, 0) / totalImpressions * 100).toFixed(2)),
    },
  };
}

function formatNum(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return n.toLocaleString();
}

export default function CampaignPerformancePage() {
  const t = useTranslations("dashboard.advertiser");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaign/list")
      .then((r) => r.json())
      .then((data: { campaigns?: Campaign[] }) => {
        const list = data.campaigns ?? [];
        setCampaigns(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;
  const perf = useMemo(
    () => (selected ? generateMockPerformance(selected) : null),
    [selected],
  );

  if (loading) {
    return (
      <DashboardChrome>
        <div className={`${landing.container} flex items-center justify-center py-32`}>
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardChrome>
    );
  }

  return (
    <DashboardChrome>
      <div className={`${landing.container} space-y-8 py-10 lg:space-y-10 lg:py-14`}>
        <div>
          <Link
            href="/dashboard/advertiser/campaigns"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("campaigns_page_title")}
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
            캠페인 성과 분석
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
            캠페인별 노출·도달·지역 성과를 확인하고 AI 추천을 받아보세요.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <div className={`${landing.card} py-16 text-center`}>
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
              아직 캠페인이 없습니다
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              캠페인을 생성하면 성과 데이터가 표시됩니다.
            </p>
            <Link href="/campaigns/new" className={`${landing.btnPrimary} mt-6`}>
              새 캠페인 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
            {/* Campaign list sidebar */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                캠페인 목록
              </h2>
              <div className="space-y-2">
                {campaigns.map((c) => {
                  const st = STATUS_MAP[c.status] ?? STATUS_MAP.DRAFT;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        selectedId === c.id
                          ? "border-blue-500 bg-blue-50/80 shadow-md dark:border-blue-500/60 dark:bg-blue-950/30"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {c.title || "(제목 없음)"}
                        </span>
                        <Badge variant="outline" className={`shrink-0 text-xs ${st.cls}`}>
                          {st.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        예산 {formatNum(c.budget_krw)}원 · {c.duration_weeks}주
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Performance panel */}
            {selected && perf && (
              <div className="space-y-6">
                {/* KPI cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className={`${landing.card} flex items-center gap-4`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                      <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">노출수</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {formatNum(perf.summary.impressions)}
                      </p>
                    </div>
                  </div>
                  <div className={`${landing.card} flex items-center gap-4`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                      <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">도달률</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {formatNum(perf.summary.reach)}
                      </p>
                    </div>
                  </div>
                  <div className={`${landing.card} flex items-center gap-4`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                      <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">CTR</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {perf.summary.ctr}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line chart */}
                <div className={landing.card}>
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    일별 노출수 추이
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perf.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke={landingChart.grid} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: landingChart.axis }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: landingChart.axis }}
                          tickLine={false}
                          tickFormatter={(v: number) => formatNum(v)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: landingChart.tooltipBg,
                            border: `1px solid ${landingChart.tooltipBorder}`,
                            borderRadius: 8,
                            color: "#fff",
                          }}
                          formatter={(value, name) => [
                            formatNum(Number(value)),
                            name === "impressions" ? "노출수" : "클릭수",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="impressions"
                          stroke={landingChart.linePrimary}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="clicks"
                          stroke={landingChart.lineSecondary}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie chart + AI suggestion */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className={landing.card}>
                    <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      <MapPin className="mr-2 inline h-5 w-5 text-blue-500" />
                      지역별 반응 분포
                    </h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={perf.regions}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={(props: PieLabelRenderProps) =>
                              `${String(props.name ?? "")} ${(Number(props.percent ?? 0) * 100).toFixed(0)}%`
                            }
                          >
                            {perf.regions.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI suggestion card */}
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-6 shadow-lg dark:border-blue-800/50 dark:from-blue-950/40 dark:to-sky-950/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        AI 추천
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                      이 캠페인의 <strong>강남/서초</strong> 지역 반응률이 가장 높습니다.
                      다음 캠페인에서는 해당 지역의 디지털 보드 매체를 추가로 고려해 보세요.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-blue-700 dark:text-blue-300">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        강남역 대형 LED 보드 — 일 노출 12만, CPM 3,200원
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        서초 교차로 빌보드 — 주간 가격 180만원, 도달률 높음
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        역삼 버스쉘터 디지털 — 2030 타겟 최적
                      </li>
                    </ul>
                    <Link
                      href="/dashboard/advertiser/recommend"
                      className={`${landing.btnPrimary} mt-6 w-full text-center`}
                    >
                      AI 맞춤 매체 추천 받기
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}
