"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart3, FileText, MapPin } from "lucide-react";
import { toast } from "sonner";
import { landing } from "@/lib/landing-theme";
import {
  TREND_REGION_POINTS,
  TREND_REGION_STATS,
  type TrendRegionId,
} from "@/lib/trends/regions";
import { openTrendsReportPrint } from "@/lib/trends/trends-report-print";
import {
  convertCurrency,
  formatCurrency,
  isSupportedCurrency,
  preferredCurrencyFromLocale,
  CURRENCY_STORAGE_KEY,
  type SupportedCurrency,
} from "@/lib/currency";
import { intlLocaleForApp } from "@/lib/i18n/locale-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendsRegionMap } from "@/components/trends/TrendsRegionMap";

function readStoredCurrency(appLocale: string): SupportedCurrency {
  if (typeof window === "undefined") return preferredCurrencyFromLocale(appLocale);
  try {
    const raw = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (raw && isSupportedCurrency(raw)) return raw;
  } catch {
    // ignore
  }
  return preferredCurrencyFromLocale(appLocale);
}

function regionPath(
  t: (key: string, values?: Record<string, string | number>) => string,
  id: TrendRegionId,
  key: string,
) {
  return t(`regions.${id}.${key}` as never);
}

export function RegionalTrendsClient() {
  const t = useTranslations("trends");
  const params = useParams();
  const appLocale = (params?.locale as string) ?? "ko";
  const intlLocale = intlLocaleForApp(appLocale);

  const [currency, setCurrency] = React.useState<SupportedCurrency>(() =>
    preferredCurrencyFromLocale(appLocale),
  );
  const [selectedId, setSelectedId] = React.useState<TrendRegionId | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setCurrency(readStoredCurrency(appLocale));
  }, [appLocale]);

  React.useEffect(() => {
    function onCurrencyChange(e: Event) {
      const d = (e as CustomEvent<string>).detail;
      if (d && isSupportedCurrency(d)) setCurrency(d);
    }
    window.addEventListener("xthex:currency-change", onCurrencyChange);
    return () => window.removeEventListener("xthex:currency-change", onCurrencyChange);
  }, []);

  const formatBudgetKrw = React.useCallback(
    (krw: number) => {
      const v = convertCurrency(krw, "KRW", currency);
      return formatCurrency(v, currency, intlLocale);
    },
    [currency, intlLocale],
  );

  const popupLineFor = React.useCallback(
    (id: TrendRegionId) => {
      const name = regionPath(t, id, "name");
      return t("map_popup", { name });
    },
    [t],
  );

  const openRegion = React.useCallback((id: TrendRegionId) => {
    setSelectedId(id);
    setDialogOpen(true);
  }, []);

  const buildSectionForRegion = React.useCallback(
    (id: TrendRegionId) => {
      const st = TREND_REGION_STATS[id];
      const heading = regionPath(t, id, "name");
      const lines = [
        `${t("popular_label")}: ${regionPath(t, id, "popular_media")}`,
        `${t("avg_budget_label")}: ${formatBudgetKrw(st.avgBudgetKrw)}`,
        `${t("yoy_label")}: ${t("yoy_value", { n: st.yoyPct })}`,
        `${t("trend_summary_label")}: ${regionPath(t, id, "trend_summary")}`,
        `${t("case_title_label")}: ${regionPath(t, id, "case_title")}`,
        regionPath(t, id, "case_body"),
      ];
      return { heading, lines };
    },
    [t, formatBudgetKrw],
  );

  const printRegionPdf = React.useCallback(
    (id: TrendRegionId) => {
      const s = buildSectionForRegion(id);
      openTrendsReportPrint({
        documentTitle: t("report_doc_title", { region: regionPath(t, id, "name") }),
        reportTitle: t("report_title"),
        sections: [s],
        footer: t("report_footer"),
      });
      toast.info(t("pdf_print_hint"));
    },
    [t, buildSectionForRegion],
  );

  const printFullPdf = React.useCallback(() => {
    const sections = TREND_REGION_POINTS.map((p) => buildSectionForRegion(p.id));
    openTrendsReportPrint({
      documentTitle: t("report_doc_full"),
      reportTitle: t("report_title"),
      sections,
      footer: t("report_footer"),
    });
    toast.info(t("pdf_print_hint"));
  }, [t, buildSectionForRegion]);

  const selectedStats = selectedId ? TREND_REGION_STATS[selectedId] : null;

  return (
    <div className={`${landing.container} py-10 lg:py-14`}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-400">
            <BarChart3 className="h-5 w-5" aria-hidden />
            {t("kicker")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button type="button" className="gap-2 self-start sm:self-auto" onClick={printFullPdf}>
          <FileText className="h-4 w-4" />
          {t("download_full_pdf")}
        </Button>
      </div>

      <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        {t("map_hint")}
      </p>

      <TrendsRegionMap
        selectedId={selectedId}
        onSelectRegion={(id) => openRegion(id)}
        popupLineFor={popupLineFor}
      />

      <h2 className="mb-4 mt-12 text-lg font-semibold">{t("cards_title")}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TREND_REGION_POINTS.map((p) => {
          const st = TREND_REGION_STATS[p.id];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => openRegion(p.id)}
                className="flex h-full w-full flex-col rounded-xl border border-zinc-200 bg-card p-4 text-left shadow-sm transition hover:border-sky-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <span className="text-base font-semibold text-foreground">{regionPath(t, p.id, "name")}</span>
                <span className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {regionPath(t, p.id, "popular_media")}
                </span>
                <span className="mt-3 text-xs font-medium text-muted-foreground">{t("avg_budget_label")}</span>
                <span className="text-lg font-bold tabular-nums text-foreground">{formatBudgetKrw(st.avgBudgetKrw)}</span>
                <span className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{t("yoy_value", { n: st.yoyPct })}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          {selectedId && selectedStats ? (
            <>
              <DialogHeader>
                <DialogTitle>{regionPath(t, selectedId, "name")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("popular_label")}</p>
                  <p className="mt-1 text-foreground">{regionPath(t, selectedId, "popular_media")}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 dark:bg-zinc-800/50">
                    <p className="text-xs text-muted-foreground">{t("avg_budget_label")}</p>
                    <p className="mt-1 font-semibold tabular-nums">{formatBudgetKrw(selectedStats.avgBudgetKrw)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 dark:bg-zinc-800/50">
                    <p className="text-xs text-muted-foreground">{t("yoy_label")}</p>
                    <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      {t("yoy_value", { n: selectedStats.yoyPct })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("trend_summary_label")}</p>
                  <p className="mt-1 leading-relaxed text-foreground">{regionPath(t, selectedId, "trend_summary")}</p>
                </div>
                <Card className="border-sky-500/20 bg-sky-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t("case_title_label")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">{regionPath(t, selectedId, "case_title")}</p>
                    <p className="mt-2">{regionPath(t, selectedId, "case_body")}</p>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t("close")}
                </Button>
                <Button type="button" className="gap-2" onClick={() => printRegionPdf(selectedId)}>
                  <FileText className="h-4 w-4" />
                  {t("download_region_pdf")}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
