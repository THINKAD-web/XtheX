"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  convertCurrency,
  formatCurrency,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency";

interface Props {
  media: any; // Prisma Media 타입
  aiScore: number;
  aiReason: string;
  currency?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

function scoreClass(score: number): string {
  if (score >= 85) return "bg-emerald-600 text-white";
  if (score >= 70) return "bg-blue-600 text-white";
  return "bg-amber-500 text-zinc-950";
}

function currencyLocale(currency: SupportedCurrency): string {
  if (currency === "KRW") return "ko-KR";
  if (currency === "JPY") return "ja-JP";
  if (currency === "EUR") return "de-DE";
  return "en-US";
}

function toSupportedCurrency(v?: string): SupportedCurrency {
  if (!v) return "USD";
  return isSupportedCurrency(v) ? v : "USD";
}

export function MediaRecommendationCard({
  media,
  aiScore,
  aiReason,
  currency = "USD",
  isSelected = false,
  onSelect,
}: Props) {
  const t = useTranslations("dashboard.advertiser.recommendationsV2");
  const targetCurrency = toSupportedCurrency(currency);
  const sourceCurrency = toSupportedCurrency(media?.currency);
  const rawPrice = typeof media?.price === "number" ? media.price : 0;
  const convertedPrice = convertCurrency(rawPrice, sourceCurrency, targetCurrency);
  const coverImage = media?.sampleImages?.[0] ?? media?.images?.[0] ?? "/og-image.png";
  const city = media?.city ?? media?.locationJson?.district ?? "Unknown";
  const countryCode = media?.globalCountryCode ?? "GL";
  const mediaName = media?.mediaName ?? "Untitled Media";

  return (
    <Card className="overflow-hidden border-sky-200/70 bg-white/95 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900/85">
      <div className="group relative aspect-video overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={mediaName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute right-3 top-3">
          <Badge className={scoreClass(aiScore)}>AI {Math.round(aiScore)}</Badge>
        </div>
        {isSelected ? (
          <div className="absolute left-3 top-3">
            <Badge className="bg-emerald-600 text-white">{t("selected")}</Badge>
          </div>
        ) : null}
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {mediaName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Badge variant="outline" className="text-[11px]">
              {countryCode}
            </Badge>
            <span>{city}</span>
          </div>
        </div>

        <p className="line-clamp-2 rounded-md bg-sky-50 px-2.5 py-2 text-xs text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
          {aiReason}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-zinc-200 px-2.5 py-2 dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">{t("price")}</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(convertedPrice, targetCurrency, currencyLocale(targetCurrency))} / {t("per_month")}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 px-2.5 py-2 dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">{t("spec")}</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {media?.specSize ?? media?.size ?? "Custom"}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              {media?.specResolution ?? media?.resolution ?? "1920x1080"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/medias/${media?.id}`}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t("view_details")}
          </Link>
          <Button
            type="button"
            className={`h-9 flex-1 ${isSelected ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}`}
            onClick={onSelect}
          >
            {isSelected ? t("selected") : t("select_for_campaign")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
