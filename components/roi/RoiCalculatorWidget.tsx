"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  avgCpm: number | null;
  defaultBudgetKrw?: number;
  ctrPercent?: number; // assumed
  durationDays?: number; // for break-even day calc
  valuePerClickKrw?: number; // demo revenue proxy per click
  className?: string;
  mediaCount?: number; // for bundle discount
  surface?: "dark" | "light";
};

function formatCompactKo(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  return n.toLocaleString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function RoiCalculatorWidget({
  locale,
  avgCpm,
  defaultBudgetKrw = 50_000_000,
  ctrPercent: ctrPercentProp = 0.3,
  durationDays: durationDaysProp = 7,
  valuePerClickKrw: valuePerClickKrwProp = 1500,
  className,
  mediaCount,
  surface = "dark",
}: Props) {
  const isKo = locale === "ko";
  const light = surface === "light";
  const [budgetInput, setBudgetInput] = React.useState(String(defaultBudgetKrw));
  const [ctrInput, setCtrInput] = React.useState(String(ctrPercentProp));
  const [daysInput, setDaysInput] = React.useState(String(durationDaysProp));
  const [vpcInput, setVpcInput] = React.useState(String(valuePerClickKrwProp));

  const budgetKrw = React.useMemo(() => {
    const digits = budgetInput.replace(/[^\d]/g, "");
    const n = Number(digits);
    return Number.isFinite(n) ? n : 0;
  }, [budgetInput]);

  const ctrPercent = React.useMemo(() => {
    const n = Number(String(ctrInput).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? clamp(n, 0, 20) : ctrPercentProp;
  }, [ctrInput, ctrPercentProp]);

  const durationDays = React.useMemo(() => {
    const n = Number(String(daysInput).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? clamp(n, 1, 60) : durationDaysProp;
  }, [daysInput, durationDaysProp]);

  const valuePerClickKrw = React.useMemo(() => {
    const n = Number(String(vpcInput).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? clamp(n, 0, 1_000_000) : valuePerClickKrwProp;
  }, [vpcInput, valuePerClickKrwProp]);

  const calc = React.useMemo(() => {
    if (!avgCpm || avgCpm <= 0 || budgetKrw <= 0) {
      return {
        impressions: null as number | null,
        clicks: null as number | null,
        cpc: null as number | null,
        breakEvenDays: null as number | null,
      };
    }

    const impressions = Math.floor((budgetKrw / avgCpm) * 1000);
    const clicks = Math.max(0, Math.round(impressions * (ctrPercent / 100)));
    const cpc = clicks > 0 ? budgetKrw / clicks : null;

    // Break-even day (demo): assume linear pacing across durationDays,
    // and revenue proxy per click (valuePerClickKrw).
    const days = durationDays;
    const dailyClicks = days > 0 ? clicks / days : 0;
    const dailyValue = dailyClicks * Math.max(0, valuePerClickKrw);
    const breakEvenDays = dailyValue > 0 ? budgetKrw / dailyValue : null;

    return { impressions, clicks, cpc, breakEvenDays };
  }, [avgCpm, budgetKrw, ctrPercent, durationDays, valuePerClickKrw]);

  const discountRate = React.useMemo(() => {
    const n = mediaCount ?? 0;
    if (n >= 7) return 0.15;
    if (n >= 5) return 0.1;
    if (n >= 3) return 0.05;
    return 0;
  }, [mediaCount]);

  const discountedBudget =
    discountRate > 0 ? Math.round(budgetKrw * (1 - discountRate)) : budgetKrw;

  return (
    <Card
      className={cn(
        light
          ? "border-zinc-200 bg-white text-zinc-900 shadow-sm"
          : "border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none",
        className,
      )}
    >
      <CardHeader className="space-y-2 p-4">
        <CardTitle className="text-base">
          {isKo ? "ROI Calculator (데모)" : "ROI Calculator (demo)"}
        </CardTitle>
        <p className={light ? "text-xs text-zinc-600" : "text-xs text-zinc-400"}>
          {isKo
            ? "예산 입력 → 예상 노출·클릭·CPC·Break-even Day를 계산합니다. (CPM/CTR 가정)"
            : "Budget → est. impressions/clicks/CPC/break-even day (assumed CPM/CTR)."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={light ? "text-xs text-zinc-600" : "text-xs text-zinc-400"}>
            {isKo ? "예산(원)" : "Budget (KRW)"}
          </div>
          <Input
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            inputMode="numeric"
            placeholder={isKo ? "예: 50000000" : "e.g. 50000000"}
            className={
              light
                ? "h-9 w-[200px] border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                : "h-9 w-[200px] border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            }
          />
        </div>

        {discountRate > 0 && budgetKrw > 0 && (
          <div
            className={
              light
                ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950"
                : "rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-50"
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {isKo
                  ? `매체 ${mediaCount ?? 0}개 번들 패키지 할인`
                  : `Bundle discount for ${mediaCount ?? 0} media`}
              </span>
              <span className="font-semibold">
                -{(discountRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <div className={light ? "text-zinc-600" : "text-zinc-200"}>
                {isKo ? "원래 예산" : "Original"}
              </div>
              <div className={light ? "text-zinc-600" : "text-zinc-200"}>
                {isKo ? "할인 후" : "After discount"}
              </div>
              <div className={light ? "text-zinc-600" : "text-zinc-200"}>
                {isKo ? "절감액" : "Saved"}
              </div>
              <div className={light ? "font-medium text-zinc-900" : "font-medium text-zinc-50"}>
                {budgetKrw.toLocaleString()}원
              </div>
              <div className={light ? "font-medium text-zinc-900" : "font-medium text-zinc-50"}>
                {discountedBudget.toLocaleString()}원
              </div>
              <div className={light ? "font-medium text-zinc-900" : "font-medium text-zinc-50"}>
                {(budgetKrw - discountedBudget).toLocaleString()}원
              </div>
            </div>
          </div>
        )}

        <div
          className={
            light
              ? "rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm"
              : "rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm"
          }
        >
          {avgCpm == null ? (
            <p className={light ? "text-zinc-600" : "text-zinc-400"}>
              {isKo ? "CPM 데이터가 있어야 계산할 수 있어요." : "CPM is required to calculate."}
            </p>
          ) : (
            <>
              <div className="flex justify-between gap-3">
                <span className={light ? "text-zinc-600" : "text-zinc-400"}>
                  {isKo ? "가정 CPM" : "Assumed CPM"}
                </span>
                <span className={light ? "font-medium text-zinc-900" : "font-medium text-zinc-100"}>
                  {avgCpm.toLocaleString()} {isKo ? "원" : "KRW"}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className={light ? "text-zinc-600" : "text-zinc-400"}>
                  {isKo ? "가정 CTR" : "Assumed CTR"}
                </span>
                <span className={light ? "font-medium text-zinc-900" : "font-medium text-zinc-100"}>
                  {ctrPercent}%
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className={light ? "text-zinc-600" : "text-zinc-400"}>
                  {isKo ? "가정 캠페인 기간" : "Assumed duration"}
                </span>
                <span className={light ? "font-medium text-zinc-900" : "font-medium text-zinc-100"}>
                  {durationDays}d
                </span>
              </div>
            </>
          )}
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="advanced" className={light ? "border-zinc-200" : "border-zinc-800"}>
            <AccordionTrigger
              className={
                light
                  ? "py-2 text-sm text-zinc-800 hover:no-underline"
                  : "py-2 text-sm text-zinc-200 hover:no-underline"
              }
            >
              {isKo ? "고급 옵션" : "Advanced options"}
            </AccordionTrigger>
            <AccordionContent className={light ? "pb-0 text-zinc-600" : "pb-0 text-zinc-400"}>
              <div
                className={
                  light
                    ? "grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-3"
                    : "grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 sm:grid-cols-3"
                }
              >
                <div className="space-y-1">
                  <div className={light ? "text-xs text-zinc-600" : "text-xs text-zinc-400"}>
                    {isKo ? "CTR (%)" : "CTR (%)"}
                  </div>
                  <Input
                    value={ctrInput}
                    onChange={(e) => setCtrInput(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.3"
                    className={
                      light
                        ? "h-9 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                        : "h-9 border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
                    }
                  />
                  <p className="text-[11px] text-zinc-500">
                    {isKo ? "0~20 범위로 제한" : "Clamped to 0–20"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className={light ? "text-xs text-zinc-600" : "text-xs text-zinc-400"}>
                    {isKo ? "기간 (일)" : "Duration (days)"}
                  </div>
                  <Input
                    value={daysInput}
                    onChange={(e) => setDaysInput(e.target.value)}
                    inputMode="numeric"
                    placeholder="7"
                    className={
                      light
                        ? "h-9 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                        : "h-9 border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
                    }
                  />
                  <p className="text-[11px] text-zinc-500">
                    {isKo ? "1~60 범위로 제한" : "Clamped to 1–60"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className={light ? "text-xs text-zinc-600" : "text-xs text-zinc-400"}>
                    {isKo ? "클릭당 가치 (₩)" : "Value / click (₩)"}
                  </div>
                  <Input
                    value={vpcInput}
                    onChange={(e) => setVpcInput(e.target.value)}
                    inputMode="numeric"
                    placeholder="1500"
                    className={
                      light
                        ? "h-9 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                        : "h-9 border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
                    }
                  />
                  <p className="text-[11px] text-zinc-500">
                    {isKo ? "0~1,000,000 범위로 제한" : "Clamped to 0–1,000,000"}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="grid gap-2 sm:grid-cols-4">
          <Metric
            labelKo="예상 노출"
            labelEn="Impressions"
            value={
              calc.impressions == null
                ? "—"
                : isKo
                  ? `${formatCompactKo(calc.impressions)}`
                  : calc.impressions.toLocaleString()
            }
            isKo={isKo}
            light={light}
          />
          <Metric
            labelKo="예상 클릭"
            labelEn="Clicks"
            value={calc.clicks == null ? "—" : calc.clicks.toLocaleString()}
            isKo={isKo}
            light={light}
          />
          <Metric
            labelKo="예상 CPC"
            labelEn="CPC"
            value={
              calc.cpc == null
                ? "—"
                : `${Math.round(calc.cpc).toLocaleString()}${isKo ? "원" : " KRW"}`
            }
            isKo={isKo}
            light={light}
          />
          <Metric
            labelKo="Break-even Day"
            labelEn="Break-even day"
            value={
              calc.breakEvenDays == null
                ? "—"
                : `${calc.breakEvenDays.toFixed(1)}d`
            }
            isKo={isKo}
            light={light}
          />
        </div>

        <p className={light ? "text-xs text-zinc-500" : "text-xs text-zinc-500"}>
          {isKo
            ? `Break-even은 클릭당 가치(가정) ₩${valuePerClickKrw.toLocaleString()} 기준으로 계산합니다.`
            : `Break-even uses a demo value per click of ₩${valuePerClickKrw.toLocaleString()}.`}
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({
  isKo,
  labelKo,
  labelEn,
  value,
  light,
}: {
  isKo: boolean;
  labelKo: string;
  labelEn: string;
  value: string;
  light?: boolean;
}) {
  return (
    <div
      className={
        light
          ? "rounded-lg border border-zinc-200 bg-zinc-50 p-3"
          : "rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
      }
    >
      <div className="text-xs text-zinc-500">{isKo ? labelKo : labelEn}</div>
      <div className={light ? "mt-1 text-sm font-semibold text-zinc-900" : "mt-1 text-sm font-semibold text-zinc-50"}>
        {value}
      </div>
    </div>
  );
}

