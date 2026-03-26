"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/recommend/currency";
import type {
  RecommendationAgeBand,
  RecommendationCategory,
  RecommendationCurrency,
  RecommendationFilters,
  RecommendationGender,
  RecommendationInterest,
} from "@/lib/recommend/recommendations-ui-types";
import { WorldRegionMapFilter } from "@/components/recommend/WorldRegionMapFilter";
import { cn } from "@/lib/utils";

const countryOptions = [
  { code: "KR", label: "Korea" },
  { code: "US", label: "United States" },
  { code: "JP", label: "Japan" },
  { code: "CN", label: "China" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "ES", label: "Spain" },
  { code: "NL", label: "Netherlands" },
] as const;

const ageOptions: RecommendationAgeBand[] = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
];
const genderOptions: RecommendationGender[] = ["ALL", "MALE", "FEMALE"];
const interestOptions: RecommendationInterest[] = [
  "Luxury",
  "Tech",
  "Travel",
  "Gaming",
  "Food",
  "Finance",
  "Sports",
  "Beauty",
];
const categoryOptions: RecommendationCategory[] = [
  "Retail",
  "Transportation",
  "Entertainment",
  "Food & Beverage",
  "Office",
  "Residential",
  "Airport",
];

type Props = {
  filters: RecommendationFilters;
  onChange: (next: RecommendationFilters) => void;
  onApply: () => void;
  className?: string;
};

function toggleValue<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function GlobalFilterPanel({ filters, onChange, onApply, className }: Props) {
  const t = useTranslations("dashboard.advertiser.recommendationsV2");
  const budgetMinUi = Math.min(filters.budgetMin, filters.budgetMax);
  const budgetMaxUi = Math.max(filters.budgetMin, filters.budgetMax);

  return (
    <Card className={cn("border-sky-200/70 dark:border-zinc-700", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">
          {t("filter_panel_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>{t("region")}</Label>
          <WorldRegionMapFilter
            selectedCodes={filters.countryCodes}
            onToggleCountry={(code) =>
              onChange({
                ...filters,
                countryCodes: toggleValue(filters.countryCodes, code),
              })
            }
          />
          <div className="flex flex-wrap gap-1.5">
            {countryOptions.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    countryCodes: toggleValue(filters.countryCodes, c.code),
                  })
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  filters.countryCodes.includes(c.code)
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t("currency")}</Label>
            <Select
              value={filters.currency}
              onValueChange={(v: RecommendationCurrency) =>
                onChange({ ...filters, currency: v })
              }
            >
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KRW">KRW</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Label className="text-xs text-zinc-500">
            {t("budget_range")}: {formatCurrency(budgetMinUi, filters.currency)} -{" "}
            {formatCurrency(budgetMaxUi, filters.currency)}
          </Label>
          <Slider
            min={0}
            max={200000}
            step={1000}
            value={budgetMinUi}
            onValueChange={(v) => onChange({ ...filters, budgetMin: v })}
          />
          <Slider
            min={0}
            max={200000}
            step={1000}
            value={budgetMaxUi}
            onValueChange={(v) => onChange({ ...filters, budgetMax: v })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("target_age")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {ageOptions.map((age) => (
              <Badge
                key={age}
                className={cn(
                  "cursor-pointer",
                  filters.ages.includes(age)
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                )}
                onClick={() =>
                  onChange({
                    ...filters,
                    ages: toggleValue(filters.ages, age),
                  })
                }
              >
                {age}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("gender")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {genderOptions.map((g) => (
              <Badge
                key={g}
                className={cn(
                  "cursor-pointer",
                  filters.genders.includes(g)
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                )}
                onClick={() =>
                  onChange({
                    ...filters,
                    genders: toggleValue(filters.genders, g),
                  })
                }
              >
                {g}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("interests")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {interestOptions.map((i) => (
              <Badge
                key={i}
                className={cn(
                  "cursor-pointer",
                  filters.interests.includes(i)
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                )}
                onClick={() =>
                  onChange({
                    ...filters,
                    interests: toggleValue(filters.interests, i),
                  })
                }
              >
                {i}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("category")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {categoryOptions.map((c) => (
              <Badge
                key={c}
                className={cn(
                  "cursor-pointer",
                  filters.categories.includes(c)
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                )}
                onClick={() =>
                  onChange({
                    ...filters,
                    categories: toggleValue(filters.categories, c),
                  })
                }
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-500"
            onClick={onApply}
          >
            {t("apply_filters")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                countryCodes: [],
                budgetMin: 0,
                budgetMax: 120000,
                ages: [],
                genders: [],
                interests: [],
                categories: [],
                currency: filters.currency,
              })
            }
            className="w-full"
          >
            {t("reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
