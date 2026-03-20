"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OmnichannelPopup } from "@/components/campaign/OmnichannelPopup";
import { Button } from "@/components/ui/button";
import { RoiCalculatorWidget } from "@/components/roi/RoiCalculatorWidget";
import { CampaignQrDownload } from "@/components/qr/CampaignQrDownload";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  locale: string;
  draft: {
    id: string;
    name: string | null;
    channelDooh: boolean;
    channelWeb: boolean;
    channelMobile: boolean;
    mediaIds: string[];
    createdAt: string;
  };
  medias: Array<{
    id: string;
    mediaName: string;
    category: string;
    locationJson: any;
    price: number | null;
    cpm: number | null;
    trustScore: number | null;
    pros: string | null;
  }>;
  performance: {
    mediaCount: number;
    minPrice: number | null;
    maxPrice: number | null;
    avgCpm: number | null;
    totalMonthlyImpressions: number | null;
  };
  today: { leads: number; impressions: number; clicks: number; spend: number };
  deltas: {
    impressionsPct: number | null;
    clicksPct: number | null;
    cpmPct: number | null;
  };
  series7d: Array<{
    date: string;
    leads: number;
    impressions: number;
    clicks: number;
    spend: number;
  }>;
};

export function CampaignDraftDashboard({
  locale,
  draft,
  medias,
  performance,
  today,
  series7d,
  deltas,
}: Props) {
  const isKo = locale === "ko";
  const [open, setOpen] = React.useState(false);

  const estimatedImpressionsForCarbon =
    performance.totalMonthlyImpressions ?? today.impressions ?? 0;
  const estimatedCarbonKg = Math.max(0, estimatedImpressionsForCarbon) * 0.0003;
  const carbonLabel =
    estimatedCarbonKg >= 1000
      ? `${(estimatedCarbonKg / 1000).toFixed(2)}t`
      : `${estimatedCarbonKg.toFixed(1)}kg`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">
            {draft.name || (isKo ? "캠페인 초안" : "Campaign draft")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isKo ? "번들 구성/성과/리드 추이를 한눈에." : "Bundle, performance and leads at a glance."}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-zinc-500">
            {draft.channelDooh && <span className="rounded bg-zinc-800 px-2 py-0.5">DOOH</span>}
            {draft.channelWeb && <span className="rounded bg-zinc-800 px-2 py-0.5">Web</span>}
            {draft.channelMobile && <span className="rounded bg-zinc-800 px-2 py-0.5">Mobile</span>}
          </div>
          <div className="mt-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              title={
                isKo
                  ? `가정식(데모): 예상 노출량 × 0.0003kg CO₂. 현재는 ${estimatedImpressionsForCarbon.toLocaleString()} 노출 기준으로 계산했습니다.`
                  : `Assumption (demo): impressions × 0.0003kg CO₂. Based on ${estimatedImpressionsForCarbon.toLocaleString()} impressions.`
              }
            >
              {isKo
                ? `이 캠페인으로 절감한 탄소량 ${carbonLabel} CO₂ (예상)`
                : `Estimated CO₂ saved: ${carbonLabel}`}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <DeltaBadge
              label={isKo ? "노출" : "Impressions"}
              value={deltas.impressionsPct}
            />
            <DeltaBadge
              label={isKo ? "클릭" : "Clicks"}
              value={deltas.clicksPct}
            />
            <DeltaBadge label="CPM" value={deltas.cpmPct} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-orange-500/50 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20"
            onClick={() => setOpen(true)}
          >
            {isKo ? "이 번들로 캠페인 저장" : "Save campaign from bundle"}
          </Button>
          <Link
            href={`/${locale}/dashboard/performance`}
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            {isKo ? "성과 예측으로" : "Back to performance"}
          </Link>
        </div>
      </div>

      <OmnichannelPopup open={open} onClose={() => setOpen(false)} mediaIds={draft.mediaIds} locale={locale} />

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label={isKo ? "매체 수" : "Media"} value={String(performance.mediaCount)} />
        <Kpi
          label={isKo ? "가격대" : "Price range"}
          value={
            performance.minPrice != null && performance.maxPrice != null
              ? `${(performance.minPrice / 10000).toFixed(0)}만 ~ ${(performance.maxPrice / 10000).toFixed(0)}만`
              : "—"
          }
        />
        <Kpi label={isKo ? "평균 CPM" : "Avg CPM"} value={performance.avgCpm != null ? performance.avgCpm.toLocaleString() : "—"} />
        <Kpi label={isKo ? "오늘 리드(문의)" : "Leads today"} value={today.leads.toLocaleString()} />
      </div>

      <CampaignQrDownload
        locale={locale}
        campaignPath={`/${locale}/campaigns/${draft.id}`}
        filename={`xthex-campaign-${draft.id}.png`}
      />

      <RoiCalculatorWidget
        locale={locale}
        avgCpm={performance.avgCpm}
        mediaCount={medias.length}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label={isKo ? "오늘 노출(데모)" : "Impressions (demo)"} value={today.impressions.toLocaleString()} />
        <Kpi label={isKo ? "오늘 클릭(데모)" : "Clicks (demo)"} value={today.clicks.toLocaleString()} />
        <Kpi
          label={isKo ? "오늘 집행액(데모)" : "Spend (demo)"}
          value={today.spend ? `${today.spend.toLocaleString()}₩` : "—"}
        />
      </div>

      <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-sm">
            {isKo ? "최근 7일 리드(문의) 추이" : "Last 7 days leads"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series7d} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46" }}
                  labelStyle={{ color: "#fafafa" }}
                />
                <Line type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-sm">
            {isKo ? "최근 7일 노출/클릭(데모) 추이" : "Last 7 days impressions/clicks (demo)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series7d} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46" }}
                  labelStyle={{ color: "#fafafa" }}
                />
                <Line type="monotone" dataKey="impressions" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-zinc-100">
          {isKo ? "번들 구성" : "Bundle media"}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {medias.map((m) => {
            const loc = (m.locationJson ?? {}) as any;
            return (
              <Card key={m.id} className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
                <CardHeader className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-base">{m.mediaName}</CardTitle>
                    <Badge variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300">
                      {m.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {loc.address ?? (isKo ? "주소 정보 없음" : "No address")}
                    {loc.district ? ` · ${loc.district}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 text-sm">
                  <div className="flex justify-between text-zinc-300">
                    <span>CPM</span>
                    <span className="font-medium">{m.cpm != null ? m.cpm.toLocaleString() : "—"}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>{isKo ? "신뢰도" : "Trust"}</span>
                    <span className="font-medium">{m.trustScore != null ? `${m.trustScore}/100` : "—"}</span>
                  </div>
                  {m.pros ? <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{m.pros}</p> : null}
                  <Link href={`/${locale}/medias/${m.id}`} className="mt-2 inline-flex text-sm font-medium text-orange-400 hover:underline">
                    {isKo ? "상세 보기 →" : "View details →"}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
      <CardHeader className="p-4">
        <CardTitle className="text-xs text-zinc-400">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-lg font-semibold text-zinc-50">{value}</div>
      </CardContent>
    </Card>
  );
}

function DeltaBadge({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  const positive = value >= 0;
  const formatted = `${positive ? "+" : ""}${value.toFixed(1)}%`;
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 border text-[11px]";
  const cls = positive
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
    : "border-red-500/40 bg-red-500/10 text-red-200";

  return (
    <span className={`${base} ${cls}`} title={`${label} 오늘 vs 어제`}>
      <span>{label}</span>
      <span>{formatted}</span>
    </span>
  );
}

