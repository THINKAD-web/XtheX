"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const DEFAULT_CTR_PERCENT = 0.3;
const WON_PER_IMPRESSION_ROI = 0.01; // 가상: 노출 1회당 0.01원 가치

type MediaForSim = {
  id: string;
  mediaName: string;
  price: number | null;
  cpm: number | null;
  exposureJson?: unknown;
};

type Props = {
  medias: MediaForSim[];
  locale: string;
  className?: string;
};

export function ComparePerfSimulator({ medias, locale, className }: Props) {
  const isKo = locale === "ko";
  const [budget, setBudget] = React.useState(50_000_000); // 5천만 원 기본

  const cpms = medias.map((m) => m.cpm).filter((c): c is number => c != null && c > 0);
  const avgCpm = cpms.length ? Math.round(cpms.reduce((a, b) => a + b, 0) / cpms.length) : null;

  const { expectedImpressions, expectedClicks, roiHint } = React.useMemo(() => {
    if (avgCpm == null || avgCpm <= 0) {
      return { expectedImpressions: null, expectedClicks: null, roiHint: null };
    }
    const impressions = Math.floor((budget / avgCpm) * 1000);
    const ctr = DEFAULT_CTR_PERCENT / 100;
    const clicks = Math.round(impressions * ctr);
    const value = impressions * WON_PER_IMPRESSION_ROI;
    const roiHint = budget > 0 ? ((value / budget) * 100).toFixed(1) : null;
    return {
      expectedImpressions: impressions,
      expectedClicks: clicks,
      roiHint,
    };
  }, [avgCpm, budget]);

  const minBudget = 10_000_000;
  const maxBudget = 500_000_000;

  const discountRate = React.useMemo(() => {
    const n = medias.length;
    if (n >= 7) return 0.15;
    if (n >= 5) return 0.1;
    if (n >= 3) return 0.05;
    return 0;
  }, [medias.length]);

  const discountedBudget =
    discountRate > 0 ? Math.round(budget * (1 - discountRate)) : budget;

  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-zinc-900">
        {isKo ? "예상 성과 시뮬레이션" : "Performance simulator"}
      </h2>
      <p className="mt-1 text-xs text-zinc-600">
        {isKo
          ? "예산을 입력하면 비교 중인 매체 평균 CPM 기준 예상 노출·클릭을 봅니다. (CTR 0.3% 가정)"
          : "Enter budget to see estimated impressions & clicks at average CPM. (CTR 0.3% assumed)"}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-600">
            {isKo ? "예산 (원)" : "Budget (KRW)"}
          </label>
          <div className="mt-2 flex items-center gap-3">
            <Slider
              value={budget}
              onValueChange={setBudget}
              min={minBudget}
              max={maxBudget}
              step={5_000_000}
              className="flex-1"
            />
            <Input
              type="text"
              inputMode="numeric"
              value={budget === 0 ? "" : budget.toLocaleString()}
              onChange={(e) => {
                const v = parseInt(e.target.value.replace(/\D/g, ""), 10);
                if (!Number.isNaN(v)) setBudget(Math.min(maxBudget, Math.max(minBudget, v)));
              }}
              className="w-36 border-zinc-200 bg-white text-zinc-900"
            />
          </div>
        </div>

        {discountRate > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {isKo
                  ? `매체 ${medias.length}개 번들 패키지 할인`
                  : `Bundle discount for ${medias.length} media`}
              </span>
              <span className="font-semibold">
                -{(discountRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <div className="text-zinc-600">
                {isKo ? "원래 예산" : "Original"}
              </div>
              <div className="text-zinc-600">
                {isKo ? "할인 후" : "After discount"}
              </div>
              <div className="text-zinc-600">
                {isKo ? "절감액" : "Saved"}
              </div>
              <div className="font-medium text-zinc-900">
                {budget.toLocaleString()}원
              </div>
              <div className="font-medium text-zinc-900">
                {discountedBudget.toLocaleString()}원
              </div>
              <div className="font-medium text-zinc-900">
                {(budget - discountedBudget).toLocaleString()}원
              </div>
            </div>
          </div>
        )}

        {avgCpm != null && (
          <p className="text-xs text-zinc-500">
            {isKo ? "비교 매체 평균 CPM" : "Avg CPM (compared media)"}: {avgCpm.toLocaleString()} {isKo ? "원" : " KRW"}
          </p>
        )}

        <dl className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
          {expectedImpressions != null && (
            <>
              <div className="flex justify-between">
                <dt className="text-zinc-600">{isKo ? "예상 노출량" : "Est. impressions"}</dt>
                <dd className="font-semibold text-orange-600">
                  {expectedImpressions >= 10000
                    ? `${(expectedImpressions / 10000).toFixed(1)}만`
                    : expectedImpressions.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">{isKo ? "예상 클릭 (CTR 0.3%)" : "Est. clicks (0.3% CTR)"}</dt>
                <dd className="font-semibold text-zinc-900">{expectedClicks?.toLocaleString() ?? "—"}</dd>
              </div>
              {roiHint != null && (
                <div className="flex justify-between border-t border-zinc-200 pt-2">
                  <dt className="text-zinc-600">{isKo ? "ROI 추정 (가상)" : "ROI estimate (demo)"}</dt>
                  <dd className="text-zinc-700">{roiHint}%</dd>
                </div>
              )}
            </>
          )}
          {avgCpm == null && (
            <p className="text-zinc-500">{isKo ? "CPM 데이터가 있어야 예상치를 계산할 수 있습니다." : "Add media with CPM to see estimates."}</p>
          )}
        </dl>
      </div>
    </section>
  );
}
