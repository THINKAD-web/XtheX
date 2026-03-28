"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Sparkles, Target, Users, Wallet, LayoutGrid } from "lucide-react";
import { landing } from "@/lib/landing-theme";
import {
  CAMPAIGN_TEMPLATE_CATALOG,
  type CampaignTemplateDef,
  type TemplateGoal,
  type TemplateIndustry,
  plannerQueryFromTemplate,
} from "@/lib/campaign-templates/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { intlLocaleForApp } from "@/lib/i18n/locale-config";

const GOALS: TemplateGoal[] = ["awareness", "launch", "conversion", "traffic"];
const INDUSTRIES: TemplateIndustry[] = ["fnb", "tech", "retail", "auto", "beauty", "finance"];

function formatBudgetKrw(manwon: number, locale: string): string {
  const krw = manwon * 10_000;
  try {
    return new Intl.NumberFormat(intlLocaleForApp(locale), {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(krw);
  } catch {
    return `₩${krw.toLocaleString()}`;
  }
}

function plannerKeyForRegion(region: string): "region_seoul" | "region_tokyo" | "region_new_york" | "region_shanghai" | "region_all" | null {
  const m: Record<string, "region_seoul" | "region_tokyo" | "region_new_york" | "region_shanghai" | "region_all"> = {
    서울: "region_seoul",
    도쿄: "region_tokyo",
    뉴욕: "region_new_york",
    상하이: "region_shanghai",
    전체: "region_all",
  };
  return m[region] ?? null;
}

function plannerKeyForAge(age: string): "age_20s" | "age_30s" | "age_40plus" | null {
  if (age === "20s") return "age_20s";
  if (age === "30s") return "age_30s";
  if (age === "40+") return "age_40plus";
  return null;
}

export function CampaignTemplatesLibrary() {
  const t = useTranslations("campaign_templates");
  const tPlanner = useTranslations("campaign_planner");
  const params = useParams();
  const locale = (params?.locale as string) ?? "ko";

  const [goalFilter, setGoalFilter] = React.useState<TemplateGoal | "ALL">("ALL");
  const [industryFilter, setIndustryFilter] = React.useState<TemplateIndustry | "ALL">("ALL");

  const filtered = React.useMemo(() => {
    return CAMPAIGN_TEMPLATE_CATALOG.filter((row) => {
      if (goalFilter !== "ALL" && row.goal !== goalFilter) return false;
      if (industryFilter !== "ALL" && row.industry !== industryFilter) return false;
      return true;
    });
  }, [goalFilter, industryFilter]);

  function cardCopy(row: CampaignTemplateDef) {
    return {
      title: t(`items.${row.id}.title`),
      desc: t(`items.${row.id}.desc`),
      target: t(`items.${row.id}.target`),
      media: t(`items.${row.id}.media`),
    };
  }

  return (
    <div className={`${landing.container} py-10 lg:py-14`}>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-300">
          <LayoutGrid className="h-5 w-5" aria-hidden />
          {t("kicker")}
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-pretty text-zinc-600 dark:text-zinc-400">{t("lead")}</p>
      </div>

      <div className="mx-auto mt-10 max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("filter_goal")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={goalFilter === "ALL" ? "default" : "outline"}
                className={cn(goalFilter === "ALL" && "bg-violet-600 hover:bg-violet-600/90")}
                onClick={() => setGoalFilter("ALL")}
              >
                {t("filter_all")}
              </Button>
              {GOALS.map((g) => (
                <Button
                  key={g}
                  type="button"
                  size="sm"
                  variant={goalFilter === g ? "default" : "outline"}
                  className={cn(goalFilter === g && "bg-violet-600 hover:bg-violet-600/90")}
                  onClick={() => setGoalFilter(g)}
                >
                  {t(`goals.${g}`)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("filter_industry")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={industryFilter === "ALL" ? "default" : "outline"}
                className={cn(industryFilter === "ALL" && "bg-sky-600 hover:bg-sky-600/90")}
                onClick={() => setIndustryFilter("ALL")}
              >
                {t("filter_all")}
              </Button>
              {INDUSTRIES.map((ind) => (
                <Button
                  key={ind}
                  type="button"
                  size="sm"
                  variant={industryFilter === ind ? "default" : "outline"}
                  className={cn(industryFilter === ind && "bg-sky-600 hover:bg-sky-600/90")}
                  onClick={() => setIndustryFilter(ind)}
                >
                  {t(`industries.${ind}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => {
              const copy = cardCopy(row);
              const qs = plannerQueryFromTemplate(row);
              const regionKey = plannerKeyForRegion(row.region);
              const ageKey = plannerKeyForAge(row.targetAge);
              return (
                <li key={row.id}>
                  <Card className="flex h-full flex-col border-zinc-200 bg-card shadow-md transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80">
                    <CardHeader className="space-y-2 pb-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {t(`goals.${row.goal}`)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {t(`industries.${row.industry}`)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-snug">{copy.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{copy.desc}</p>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 text-sm">
                      <div className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 dark:bg-zinc-800/50">
                        <Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t("label_goal_target")}</p>
                          <p className="text-foreground">{copy.target}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 dark:bg-zinc-800/50">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t("label_media")}</p>
                          <p className="text-foreground">{copy.media}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 dark:bg-zinc-800/50">
                        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t("label_budget")}</p>
                          <p className="font-semibold tabular-nums text-foreground">
                            {formatBudgetKrw(row.budgetManwon, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {regionKey ? tPlanner(regionKey) : row.region} · {ageKey ? tPlanner(ageKey) : row.targetAge}
                        </span>
                      </div>
                    </CardContent>
                    <div className="mt-auto px-6 pb-6 pt-2">
                      <Link
                        href={`/campaign-planner?${qs}`}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-600/90"
                      >
                        <Sparkles className="h-4 w-4" />
                        {t("apply_cta")}
                      </Link>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
