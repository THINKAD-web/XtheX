"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel } from "@/components/ui/image-carousel";
import type { SuccessCase } from "@/lib/case-studies/success-cases";
import { landing } from "@/lib/landing-theme";

type Props = {
  locale: string;
  cases: SuccessCase[];
  /** When set, overrides titleKo/titleEn for the section heading (i18n). */
  headingTitle?: string;
  headingSubtitle?: string;
  titleKo?: string;
  titleEn?: string;
  subtitleKo?: string;
  subtitleEn?: string;
  /** If provided, buttons call onApply(caseId) instead of navigation */
  onApply?: (caseId: string) => void | Promise<void>;
  /** Fallback navigation when onApply isn't provided */
  applyHrefBase?: string; // e.g. `/${locale}/admin/medias`
  /** Optional: show dynamic KPI based on current average CPM */
  avgCpm?: number | null;
  className?: string;
  /** admin/medias 등 밝은 배경용 */
  tone?: "dark" | "light";
};

function estimateFromCpm(input: { budgetKrw: number; cpm: number; ctrPercent: number; valuePerClickKrw: number }) {
  const impressions = Math.floor((input.budgetKrw / input.cpm) * 1000);
  const clicks = Math.max(0, Math.round(impressions * (input.ctrPercent / 100)));
  const cpc = clicks > 0 ? input.budgetKrw / clicks : null;
  const value = clicks * input.valuePerClickKrw;
  const roi = input.budgetKrw > 0 ? (value - input.budgetKrw) / input.budgetKrw : null;
  return { impressions, clicks, cpc, roi };
}

function compactKo(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  return n.toLocaleString();
}

export function SuccessCaseGallery({
  locale,
  cases,
  headingTitle,
  headingSubtitle,
  titleKo = "성공 사례 갤러리",
  titleEn = "Success case gallery",
  subtitleKo = "검증된 조합을 보고, 필터로 바로 적용해 보세요.",
  subtitleEn = "See proven combos and apply filters instantly.",
  onApply,
  applyHrefBase,
  avgCpm = null,
  className,
  tone = "dark",
}: Props) {
  const isKo = locale === "ko";
  const onLight = tone === "light";
  const demoBudget = 30_000_000;
  const ctr = 0.3;
  const vpc = 1500;

  return (
    <section className={className ?? "space-y-5"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            className={`home-solid-heading text-3xl font-bold tracking-tight sm:text-4xl ${onLight ? "text-zinc-900" : "text-zinc-50"}`}
          >
            {headingTitle ?? (isKo ? titleKo : titleEn)}
          </h2>
          <p
            className={`home-solid-lead mt-2 max-w-2xl text-pretty text-base leading-relaxed ${onLight ? "text-zinc-600" : "text-zinc-400"}`}
          >
            {headingSubtitle ?? (isKo ? subtitleKo : subtitleEn)}
          </p>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto overflow-y-visible pb-3 pt-1">
        {cases.slice(0, 6).map((c) => {
          const title = isKo ? c.titleKo : c.titleEn;
          const industry = isKo ? c.industryKo : c.industryEn;
          const summary = isKo ? c.summaryKo : c.summaryEn;
          const kpi = isKo ? c.kpiKo : c.kpiEn;
          const dyn =
            typeof avgCpm === "number" && avgCpm > 0
              ? estimateFromCpm({ budgetKrw: demoBudget, cpm: avgCpm, ctrPercent: ctr, valuePerClickKrw: vpc })
              : null;

          const content = (
            <div
              className={`min-w-[300px] max-w-[340px] flex-shrink-0 text-zinc-100 ${landing.cardDark} p-4`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                    {title}
                  </h3>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-blue-500/40 bg-blue-500/10 text-xs text-blue-300"
                  >
                    {industry}
                  </Badge>
                </div>
                <p className="text-pretty text-xs leading-relaxed text-zinc-400">
                  {summary}
                </p>
              </div>

              <div className="mt-3 space-y-3">
                <ImageCarousel images={c.images} height={160} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-cyan-400/90">{kpi}</span>
                  {onApply ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                      onClick={() => onApply(c.id)}
                    >
                      {isKo ? "이 사례 필터로 바로 적용" : "Apply this case filter"}
                    </Button>
                  ) : applyHrefBase ? (
                    <Link href={`${applyHrefBase}?successCase=${encodeURIComponent(c.id)}`}>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                      >
                        {isKo ? "이 사례 필터로 바로 적용" : "Apply this case filter"}
                      </Button>
                    </Link>
                  ) : null}
                </div>

                {dyn ? (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-950/50 p-3 text-xs text-zinc-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400">
                        {isKo ? "현재 필터 기준 예상 KPI" : "Est. KPI from current filter"}
                      </span>
                      <span className="text-zinc-500">
                        {isKo ? `예산 ${compactKo(demoBudget)}원 · CTR ${ctr}%` : `Budget ₩${demoBudget.toLocaleString()} · CTR ${ctr}%`}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">{isKo ? "노출" : "Imp."}</span>
                        <span className="font-medium text-zinc-100">
                          {isKo ? compactKo(dyn.impressions) : dyn.impressions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">{isKo ? "클릭" : "Clicks"}</span>
                        <span className="font-medium text-zinc-100">{dyn.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">CPC</span>
                        <span className="font-medium text-zinc-100">
                          {dyn.cpc == null ? "—" : `${Math.round(dyn.cpc).toLocaleString()}${isKo ? "원" : " KRW"}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ROI</span>
                        <span className="font-medium text-zinc-100">
                          {dyn.roi == null ? "—" : `${(dyn.roi * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {isKo
                      ? "필터 적용 후(매체 CPM 확보) 동적 KPI가 표시됩니다."
                      : "Apply filters to show dynamic KPI (needs CPM)."}
                  </p>
                )}
              </div>
            </div>
          );

          return <div key={c.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}

