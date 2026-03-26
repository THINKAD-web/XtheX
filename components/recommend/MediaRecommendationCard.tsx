"use client";

import { CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, fromKrw, toKrw } from "@/lib/recommend/currency";
import type {
  RecommendationCurrency,
  RecommendationItem,
} from "@/lib/recommend/recommendations-ui-types";
import { cn } from "@/lib/utils";

type Props = {
  item: RecommendationItem;
  displayCurrency: RecommendationCurrency;
  isSelected?: boolean;
  onSelectForCampaign?: (mediaId: string) => void;
};

function scoreTone(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-300";
  if (score >= 70) return "text-blue-600 dark:text-sky-300";
  return "text-amber-600 dark:text-amber-300";
}

const FLAG: Record<string, string> = {
  KR: "🇰🇷",
  US: "🇺🇸",
  JP: "🇯🇵",
  CN: "🇨🇳",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  IT: "🇮🇹",
  ES: "🇪🇸",
  NL: "🇳🇱",
};

export function MediaRecommendationCard({
  item,
  displayCurrency,
  isSelected = false,
  onSelectForCampaign,
}: Props) {
  const t = useTranslations("dashboard.advertiser.recommendationsV2");
  const normalizedPrice = fromKrw(toKrw(item.monthlyPrice, item.currency), displayCurrency);
  const progress = Math.max(0, Math.min(100, item.aiMatchScore));
  const progressColor = item.aiMatchScore >= 85 ? "#10b981" : item.aiMatchScore >= 70 ? "#3b82f6" : "#f59e0b";

  return (
    <Card className="overflow-hidden border-sky-200/60 bg-white/95 dark:border-zinc-700 dark:bg-zinc-900/80">
      <div className="group relative aspect-video w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.mediaName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {item.mediaName}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5" />
              {item.city}, {item.country}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge variant="outline" className="text-[11px]">
                {FLAG[item.globalCountryCode] ?? "🌐"} {item.globalCountryCode}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                {item.city}
              </Badge>
            </div>
          </div>
          <div
            className="grid h-14 w-14 place-items-center rounded-full text-sm font-bold tabular-nums"
            style={{
              background: `conic-gradient(${progressColor} ${progress * 3.6}deg, rgba(148,163,184,.35) 0deg)`,
            }}
            aria-label={`AI match score ${item.aiMatchScore}`}
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              <span className={cn("text-sm font-extrabold", scoreTone(item.aiMatchScore))}>{item.aiMatchScore}</span>
            </div>
          </div>
        </div>

        <p className="rounded-md bg-sky-50 px-2.5 py-2 text-xs text-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          {item.aiReason}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-zinc-200 px-2.5 py-2 dark:border-zinc-700">
            <p className="text-zinc-500">Price</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(normalizedPrice, displayCurrency)} / {t("per_month")}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 px-2.5 py-2 dark:border-zinc-700">
            <p className="text-zinc-500">{t("spec")}</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {item.specSize}
            </p>
            <p className="text-zinc-500">{item.specResolution}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/medias/${item.id}`}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t("view_details")}
          </Link>
          <Button
            type="button"
            className={cn(
              "h-9 flex-1",
              isSelected
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-blue-600 hover:bg-blue-500",
            )}
            onClick={() => onSelectForCampaign?.(item.id)}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {isSelected ? t("selected") : t("select_for_campaign")}
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[11px]">
            {item.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
