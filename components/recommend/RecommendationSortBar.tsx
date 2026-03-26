"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecommendationSort } from "@/lib/recommend/recommendations-ui-types";

type Props = {
  sort: RecommendationSort;
  onChange: (next: RecommendationSort) => void;
};

export function RecommendationSortBar({ sort, onChange }: Props) {
  const t = useTranslations("dashboard.advertiser.recommendationsV2");
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200/60 bg-white/90 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/80">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t("sort_label")}</p>
      <Select value={sort} onValueChange={(v) => onChange(v as RecommendationSort)}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="score_desc">{t("sort_score_desc")}</SelectItem>
          <SelectItem value="price_asc">{t("sort_price_asc")}</SelectItem>
          <SelectItem value="updated_desc">{t("sort_updated_desc")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
