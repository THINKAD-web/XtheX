"use client";

import * as React from "react";
import { HelpCircle, ThumbsDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, fromKrw, toKrw } from "@/lib/recommend/currency";
import type { PersonalizedRecoItem } from "@/lib/recommend/personalized-engine";
import type { RecommendationCurrency } from "@/lib/recommend/recommendations-ui-types";
import { cn } from "@/lib/utils";

type Props = {
  item: PersonalizedRecoItem;
  displayCurrency: RecommendationCurrency;
  onDismiss: (mediaId: string) => void;
  onNegativeFeedback: (mediaId: string) => void;
};

export function PersonalizedRecoCard({
  item,
  displayCurrency,
  onDismiss,
  onNegativeFeedback,
}: Props) {
  const t = useTranslations("personalizedRecommendations");
  const normalizedPrice = fromKrw(toKrw(item.monthlyPrice, item.currency), displayCurrency);

  return (
    <Card className="relative w-[280px] shrink-0 overflow-hidden border-violet-200/70 bg-white/95 dark:border-zinc-700 dark:bg-zinc-900/85">
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="h-8 w-8 shrink-0 rounded-full bg-white/90 p-0 shadow-sm dark:bg-zinc-800/90"
              aria-label={t("reason_tooltip_trigger")}
            >
              <HelpCircle className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-left text-xs leading-relaxed">
            <p className="font-semibold text-violet-200">{t("reason_title")}</p>
            <p className="mt-1 whitespace-pre-line text-popover-foreground">
              {item.personalizedReasonDetail || item.personalizedReason}
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {t("model_label")}: {item.modelVersion}
            </p>
          </TooltipContent>
        </Tooltip>
        <Button
          type="button"
          variant="secondary"
          className="h-8 w-8 shrink-0 rounded-full bg-white/90 p-0 shadow-sm dark:bg-zinc-800/90"
          aria-label={t("dismiss_aria")}
          onClick={() => onDismiss(item.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.mediaName}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        />
        <div className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {t("ml_badge")}
        </div>
      </div>

      <CardContent className="space-y-2 p-3 pt-2">
        <div className="pr-14">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.mediaName}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {item.city}, {item.country}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px]">
            {item.globalCountryCode}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {item.aiMatchScore}% {t("match_short")}
          </Badge>
        </div>
        <p className="line-clamp-2 text-[11px] leading-snug text-violet-800/90 dark:text-violet-200/90">
          {item.personalizedReason}
        </p>
        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
          {formatCurrency(normalizedPrice, displayCurrency)} / {t("per_month")}
        </p>
        <div className="flex gap-2 pt-1">
          <Link
            href={`/medias/${item.id}`}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center rounded-md border border-zinc-300 text-xs font-medium",
              "text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800",
            )}
          >
            {t("view_detail")}
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1 px-2 text-xs text-amber-800 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-950/40"
            onClick={() => onNegativeFeedback(item.id)}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            {t("feedback_negative")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
