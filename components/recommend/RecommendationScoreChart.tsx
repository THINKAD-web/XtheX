"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RecommendationItem } from "@/lib/recommend/recommendations-ui-types";

type Props = {
  items: RecommendationItem[];
};

function toBuckets(items: RecommendationItem[]) {
  const groups = [
    { name: "90-100", min: 90, max: 100 },
    { name: "80-89", min: 80, max: 89 },
    { name: "70-79", min: 70, max: 79 },
    { name: "0-69", min: 0, max: 69 },
  ];
  return groups.map((g) => ({
    bucket: g.name,
    count: items.filter((i) => i.aiMatchScore >= g.min && i.aiMatchScore <= g.max).length,
  }));
}

export function RecommendationScoreChart({ items }: Props) {
  const t = useTranslations("dashboard.advertiser.recommendationsV2");
  const data = toBuckets(items);
  return (
    <div className="rounded-xl border border-sky-200/60 bg-white/90 p-4 dark:border-zinc-700 dark:bg-zinc-900/80">
      <p className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {t("chart_title")}
      </p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
