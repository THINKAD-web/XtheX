"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { GlobalFilterPanel } from "@/components/recommend/GlobalFilterPanel";
import { MediaRecommendationCard } from "@/components/media/MediaRecommendationCard";
import { RecommendationScoreChart } from "@/components/recommend/RecommendationScoreChart";
import { RecommendationSortBar } from "@/components/recommend/RecommendationSortBar";
import { getMockGlobalRecommendations } from "@/lib/recommend/mock-global-recommendations";
import { fromKrw, toKrw } from "@/lib/recommend/currency";
import { usePreferredCurrency } from "@/components/usePreferredCurrency";
import type {
  RecommendationFilters,
  RecommendationItem,
  RecommendationSort,
} from "@/lib/recommend/recommendations-ui-types";

const INITIAL_FILTERS: RecommendationFilters = {
  countryCodes: [],
  budgetMin: 0,
  budgetMax: 120000,
  ages: [],
  genders: [],
  interests: [],
  categories: [],
  currency: "USD",
};
const SHORTLIST_STORAGE_KEY = "xthex:recommendation-shortlist:v1";

function matchFilters(item: RecommendationItem, filters: RecommendationFilters): boolean {
  if (filters.countryCodes.length > 0 && !filters.countryCodes.includes(item.globalCountryCode)) {
    return false;
  }

  const priceInSelectedCurrency = fromKrw(
    toKrw(item.monthlyPrice, item.currency),
    filters.currency,
  );
  const budgetMin = Math.min(filters.budgetMin, filters.budgetMax);
  const budgetMax = Math.max(filters.budgetMin, filters.budgetMax);
  if (priceInSelectedCurrency < budgetMin || priceInSelectedCurrency > budgetMax) {
    return false;
  }

  if (filters.ages.length > 0 && !filters.ages.some((age) => item.targetAges.includes(age))) {
    return false;
  }

  if (
    filters.genders.length > 0 &&
    !filters.genders.includes(item.targetGender) &&
    !filters.genders.includes("ALL")
  ) {
    return false;
  }

  if (filters.interests.length > 0 && !filters.interests.some((i) => item.interests.includes(i))) {
    return false;
  }

  if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
    return false;
  }

  return true;
}

function sortItems(items: RecommendationItem[], sort: RecommendationSort): RecommendationItem[] {
  const copied = [...items];
  copied.sort((a, b) => {
    if (sort === "score_desc") return b.aiMatchScore - a.aiMatchScore;
    if (sort === "price_asc") {
      const aKrw = toKrw(a.monthlyPrice, a.currency);
      const bKrw = toKrw(b.monthlyPrice, b.currency);
      return aKrw - bKrw;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return copied;
}

type Props = {
  initialItems?: RecommendationItem[];
  locale?: string;
};

export function RecommendationsExperience({ initialItems, locale = "en" }: Props) {
  const t = useTranslations("dashboard.advertiser.recommendationsV2");
  const preferredCurrency = usePreferredCurrency(locale);
  const [filters, setFilters] = React.useState<RecommendationFilters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<RecommendationFilters>(INITIAL_FILTERS);
  const [sort, setSort] = React.useState<RecommendationSort>("score_desc");
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const ids = parsed.filter((v): v is string => typeof v === "string");
      setSelectedMediaIds(ids);
    } catch {
      // ignore corrupted local storage
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(selectedMediaIds));
  }, [selectedMediaIds]);

  React.useEffect(() => {
    setFilters((prev) => (prev.currency === preferredCurrency ? prev : { ...prev, currency: preferredCurrency }));
    setAppliedFilters((prev) =>
      prev.currency === preferredCurrency ? prev : { ...prev, currency: preferredCurrency },
    );
  }, [preferredCurrency]);

  const baseItems = React.useMemo(
    () => (initialItems && initialItems.length > 0 ? initialItems : getMockGlobalRecommendations()),
    [initialItems],
  );
  const filteredItems = React.useMemo(
    () => baseItems.filter((item) => matchFilters(item, appliedFilters)),
    [baseItems, appliedFilters],
  );
  const sortedItems = React.useMemo(
    () => sortItems(filteredItems, sort),
    [filteredItems, sort],
  );

  return (
    <div className="space-y-4">
      <div className="lg:hidden">
        <Button type="button" variant="outline" onClick={() => setMobileFilterOpen((v) => !v)}>
          {mobileFilterOpen ? t("mobile_close_filters") : t("mobile_open_filters")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={mobileFilterOpen ? "block" : "hidden lg:block"}>
          <GlobalFilterPanel
            filters={filters}
            onChange={setFilters}
            onApply={() => setAppliedFilters(filters)}
          />
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200/60 bg-white/90 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/80">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {t("shortlist_count", { count: selectedMediaIds.length })}
            </p>
            <Link
              href={`/campaigns/new${selectedMediaIds.length ? `?mediaIds=${selectedMediaIds.join(",")}` : ""}`}
              className="inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-500"
            >
              {t("go_to_campaign")}
            </Link>
            {selectedMediaIds.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => setSelectedMediaIds([])}
              >
                {t("clear_shortlist")}
              </Button>
            ) : null}
          </div>
          <RecommendationSortBar sort={sort} onChange={setSort} />
          <RecommendationScoreChart items={sortedItems} />

          {sortedItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white/70 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
              {t("empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedItems.map((item) => (
                <MediaRecommendationCard
                  key={item.id}
                  media={{
                    id: item.id,
                    mediaName: item.mediaName,
                    price: item.monthlyPrice,
                    currency: item.currency,
                    images: [item.imageUrl],
                    sampleImages: [item.imageUrl],
                    city: item.city,
                    globalCountryCode: item.globalCountryCode,
                    specSize: item.specSize,
                    specResolution: item.specResolution,
                  }}
                  aiScore={item.aiMatchScore}
                  aiReason={item.aiReason}
                  currency={filters.currency}
                  isSelected={selectedMediaIds.includes(item.id)}
                  onSelect={() =>
                    setSelectedMediaIds((prev) =>
                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
