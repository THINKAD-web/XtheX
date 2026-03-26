"use client";

import * as React from "react";
import { X, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExploreApiItem } from "@/lib/explore/explore-item";
import { cn } from "@/lib/utils";
import {
  convertCurrency,
  formatCurrency,
  type SupportedCurrency,
} from "@/lib/currency";

type Props = {
  open: boolean;
  onClose: () => void;
  items: ExploreApiItem[];
  onInquiry: (item: ExploreApiItem) => void;
  onBulkInquiry?: (items: ExploreApiItem[]) => void;
  currency: SupportedCurrency;
};

function getAddress(loc: unknown): string {
  if (!loc || typeof loc !== "object") return "—";
  const o = loc as Record<string, unknown>;
  if (typeof o.address === "string" && o.address.trim()) return o.address;
  if (typeof o.district === "string" && o.district.trim()) return o.district;
  return "—";
}

function getLocationParts(loc: unknown): {
  address: string;
  district: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
} {
  if (!loc || typeof loc !== "object") {
    return { address: "—", district: null, city: null, lat: null, lng: null };
  }
  const o = loc as Record<string, unknown>;
  return {
    address: getAddress(loc),
    district: typeof o.district === "string" ? o.district : null,
    city: typeof o.city === "string" ? o.city : null,
    lat: typeof o.lat === "number" ? o.lat : null,
    lng: typeof o.lng === "number" ? o.lng : null,
  };
}

function formatMoney(v: number | null, currency: SupportedCurrency, locale: string): string {
  if (v == null) return "—";
  const converted = convertCurrency(v, "KRW", currency);
  return formatCurrency(converted, currency, locale === "ko" ? "ko-KR" : "en-US");
}

function formatDateText(v: string, locale: string): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US");
}

function parseExposureCount(v: string | null): number | null {
  if (!v) return null;
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function CompareModal({
  open,
  onClose,
  items,
  onInquiry,
  onBulkInquiry,
  currency,
}: Props) {
  const tv = useTranslations("explore.v2.compare.modal");
  const locale = useLocale();
  const isKo = locale === "ko";
  if (!open) return null;

  const lowestPrice = items
    .map((it) => it.priceMin)
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => a - b)[0] ?? null;
  const bestAiScore = items
    .map((it) => it.aiReviewScore)
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => b - a)[0] ?? null;
  const avgTrustScore = (() => {
    const vals = items
      .map((it) => it.trustScore)
      .filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((acc, cur) => acc + cur, 0) / vals.length);
  })();
  const lowestPriceValue =
    items
      .map((it) => it.priceMin)
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b)[0] ?? null;
  const bestAiValue =
    items
      .map((it) => it.aiReviewScore)
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => b - a)[0] ?? null;
  const bestTrustValue =
    items
      .map((it) => it.trustScore)
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => b - a)[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="compare-title"
    >
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 id="compare-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {tv("title", { count: items.length })}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{tv("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={tv("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {onBulkInquiry ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="gap-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              onClick={() => onBulkInquiry(items)}
            >
              <MessageCircle className="h-4 w-4" />
              {tv("bulk_inquiry")}
            </Button>
            <Badge className="bg-emerald-600/10 text-emerald-800">{tv("hint_max", { count: 4 })}</Badge>
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[11px] text-zinc-500">{isKo ? "최저 월 예산" : "Lowest monthly budget"}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatMoney(lowestPrice, currency, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[11px] text-zinc-500">{isKo ? "최고 AI 점수" : "Best AI score"}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {bestAiScore != null ? `${bestAiScore} / 100` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[11px] text-zinc-500">{isKo ? "평균 신뢰도" : "Average trust score"}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {avgTrustScore != null ? `${avgTrustScore} / 100` : "—"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-[1240px] w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">{tv("col_media")}</th>
                <th className="px-4 py-3">{isKo ? "가격/규격" : "Pricing/Spec"}</th>
                <th className="px-4 py-3">{tv("col_location")}</th>
                <th className="px-4 py-3">{isKo ? "성과 지표" : "Performance"}</th>
                <th className="px-4 py-3">{isKo ? "신뢰도" : "Confidence"}</th>
                <th className="px-4 py-3">{tv("col_desc")}</th>
                <th className="px-4 py-3">{tv("col_action")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const loc = getLocationParts(it.location);
                const dailyExposureParsed = parseExposureCount(it.dailyExposure);
                return (
                  <tr
                    key={it.id}
                    className="border-t border-zinc-200 align-top dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-20 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
                          {it.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={it.images[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-50">
                            {it.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge className="bg-blue-600/10 text-blue-700 dark:text-sky-300">
                              {String(it.mediaType)}
                            </Badge>
                            <Badge className="bg-zinc-600/10 text-zinc-700 dark:text-zinc-300">
                              {isKo ? "이미지" : "Images"} {it.images.length}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {isKo ? "등록일" : "Created"}: {formatDateText(it.createdAt, locale)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <div
                        className={cn(
                          "space-y-1.5 rounded-md p-2",
                          lowestPriceValue != null && it.priceMin === lowestPriceValue
                            ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                            : "",
                        )}
                      >
                        <p className="text-xs">
                          <span className="text-zinc-500">{isKo ? "월 비용" : "Monthly"}:</span>{" "}
                          <span className="font-medium">
                            {formatMoney(it.priceMin, currency, locale)}
                          </span>
                          {lowestPriceValue != null && it.priceMin === lowestPriceValue ? (
                            <Badge className="ml-1 bg-emerald-600 text-white">
                              {isKo ? "최저가" : "Best price"}
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs">
                          <span className="text-zinc-500">{isKo ? "상한 비용" : "Upper"}:</span>{" "}
                          <span className="font-medium">
                            {formatMoney(it.priceMax, currency, locale)}
                          </span>
                        </p>
                        <p className="text-xs">
                          <span className="text-zinc-500">{isKo ? "규격" : "Size"}:</span>{" "}
                          {it.size || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <div className="space-y-1.5">
                        <p className="line-clamp-2 text-xs">{loc.address}</p>
                        <p className="text-[11px] text-zinc-500">
                          {[loc.city, loc.district].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {loc.lat != null && loc.lng != null
                            ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
                            : "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <div className="space-y-1.5">
                        <p className="text-xs">
                          <span className="text-zinc-500">{isKo ? "일 노출" : "Daily exposure"}:</span>{" "}
                          <span className="font-medium">
                            {dailyExposureParsed != null
                              ? `${dailyExposureParsed.toLocaleString()}`
                              : it.dailyExposure ?? "—"}
                          </span>
                        </p>
                        <p className="text-xs">
                          <span className="text-zinc-500">{isKo ? "예산 효율" : "Cost efficiency"}:</span>{" "}
                          {it.priceMin != null && dailyExposureParsed
                            ? `${Math.round(convertCurrency(it.priceMin, "KRW", currency) / dailyExposureParsed).toLocaleString()} ${currency}/exposure`
                            : "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <div
                        className={cn(
                          "space-y-1.5 rounded-md p-2",
                          (bestAiValue != null && it.aiReviewScore === bestAiValue) ||
                            (bestTrustValue != null && it.trustScore === bestTrustValue)
                            ? "bg-blue-500/10 ring-1 ring-blue-500/30"
                            : "",
                        )}
                      >
                        <p className="text-xs">
                          <span className="text-zinc-500">AI:</span>{" "}
                          <span className="font-medium">
                            {it.aiReviewScore != null ? `${it.aiReviewScore}/100` : "—"}
                          </span>
                          {bestAiValue != null && it.aiReviewScore === bestAiValue ? (
                            <Badge className="ml-1 bg-blue-600 text-white">
                              {isKo ? "최고 AI" : "Top AI"}
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs">
                          <span className="text-zinc-500">{isKo ? "신뢰도" : "Trust"}:</span>{" "}
                          <span className="font-medium">
                            {it.trustScore != null ? `${it.trustScore}/100` : "—"}
                          </span>
                          {bestTrustValue != null && it.trustScore === bestTrustValue ? (
                            <Badge className="ml-1 bg-indigo-600 text-white">
                              {isKo ? "최고 신뢰도" : "Top trust"}
                            </Badge>
                          ) : null}
                        </p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500",
                            )}
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, it.aiReviewScore ?? it.trustScore ?? 0),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <span className="line-clamp-5 max-w-[360px] text-xs leading-relaxed">
                        {it.description || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <Button type="button" size="sm" className="gap-1" onClick={() => onInquiry(it)}>
                          <MessageCircle className="h-4 w-4" />
                          {tv("inquiry")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                    {tv("empty")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

