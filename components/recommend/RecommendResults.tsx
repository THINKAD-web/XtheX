"use client";

import {
  Bus,
  ImageIcon,
  LayoutPanelTop,
  MapPin,
  Monitor,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { landing } from "@/lib/landing-theme";
import type { MediaCategory } from "@prisma/client";
import type { MediaRecommendationItem } from "@/lib/recommend/types";
import { cn } from "@/lib/utils";

function categoryLabel(
  type: MediaCategory,
  t: (key: string) => string,
): string {
  switch (type) {
    case "BILLBOARD":
      return t("cat_BILLBOARD");
    case "DIGITAL_BOARD":
      return t("cat_DIGITAL_BOARD");
    case "TRANSIT":
      return t("cat_TRANSIT");
    case "STREET_FURNITURE":
      return t("cat_STREET_FURNITURE");
    case "WALL":
      return t("cat_WALL");
    case "ETC":
      return t("cat_ETC");
    default:
      return type;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function CategoryIcon({ category }: { category: string }) {
  const c = category.toUpperCase();
  const iconClass = "h-6 w-6 text-blue-600 dark:text-sky-400";
  if (c === "BILLBOARD") return <PanelsTopLeft className={iconClass} />;
  if (c === "DIGITAL_BOARD") return <Monitor className={iconClass} />;
  if (c === "TRANSIT") return <Bus className={iconClass} />;
  if (c === "STREET_FURNITURE") return <LayoutPanelTop className={iconClass} />;
  if (c === "WALL") return <ImageIcon className={iconClass} />;
  return <MapPin className={iconClass} />;
}

type Props = {
  items: MediaRecommendationItem[];
  className?: string;
};

function ResultCard({ item }: { item: MediaRecommendationItem }) {
  const t = useTranslations("dashboard.advertiser.recommend");
  const typeLabel = categoryLabel(item.type, t);
  const isRealId = UUID_RE.test(item.mediaId);

  return (
    <li
      className={cn(
        landing.card,
        "flex flex-col border-sky-200/40 bg-white/95 dark:border-zinc-700 dark:bg-zinc-900/80",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-50 p-2.5 dark:bg-sky-950/40">
          <CategoryIcon category={item.type} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-foreground">{item.name}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            {typeLabel}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{item.location}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-blue-50/80 px-3 py-2 dark:bg-blue-950/30">
          <p className="text-xs text-muted-foreground">{t("score")}</p>
          <p className="text-lg font-bold tabular-nums text-blue-800 dark:text-sky-300">
            {item.score}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50/80 px-3 py-2 dark:bg-emerald-950/25">
          <p className="text-xs text-muted-foreground">{t("est_impressions")}</p>
          <p className="text-lg font-bold tabular-nums text-emerald-900 dark:text-emerald-200">
            {item.estimatedImpressions.toLocaleString()}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("est_cost")}:{" "}
        <span className="font-medium text-foreground">
          {item.priceEstimate.toLocaleString()}원
        </span>
      </p>
      {item.isMock ? (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{t("demo_badge")}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {isRealId ? (
          <Link
            href={`/medias/${item.mediaId}/contact`}
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium",
              "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {t("inquiry")}
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.alert(t("inquiry_demo"))}
          >
            {t("inquiry")}
          </Button>
        )}
        {isRealId ? (
          <Link
            href={`/medias/${item.mediaId}`}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            {t("detail")}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function RecommendResults({ items, className }: Props) {
  const t = useTranslations("dashboard.advertiser.recommend");

  if (items.length === 0) {
    return (
      <div
        className={cn(
          landing.surface,
          "border-dashed border-emerald-300/60 py-14 text-center dark:border-emerald-900/40",
          className,
        )}
      >
        <p className="text-lg font-medium text-foreground">{t("empty_title")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("empty_hint")}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        {t("results_title")}
      </h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ResultCard key={item.mediaId} item={item} />
        ))}
      </ul>
    </div>
  );
}
