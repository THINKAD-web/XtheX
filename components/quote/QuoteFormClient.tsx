"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FileText,
  Copy,
  Save,
  Calculator,
  ChevronDown,
  Check,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { landing } from "@/lib/landing-theme";

type MediaOption = {
  id: string;
  mediaName: string;
  category: string;
  price: number | null;
};

type Props = {
  medias: MediaOption[];
  locale: string;
};

const OPTION_MULTIPLIERS = {
  premium: 0.3,
  creative: 0.15,
  report: 0.05,
} as const;

export function QuoteFormClient({ medias, locale }: Props) {
  const t = useTranslations("quote");
  const isKo = locale === "ko";

  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [budget, setBudget] = useState(500);
  const [options, setOptions] = useState({
    premium: false,
    creative: false,
    report: false,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedMedia = medias.find((m) => m.id === selectedMediaId);

  const calculation = useMemo(() => {
    if (!selectedMedia?.price) return null;

    const monthlyPrice = selectedMedia.price;
    const weeklyPrice = Math.round(monthlyPrice / 4);
    const baseCost = weeklyPrice * weeks;

    let optionCost = 0;
    if (options.premium) optionCost += baseCost * OPTION_MULTIPLIERS.premium;
    if (options.creative) optionCost += baseCost * OPTION_MULTIPLIERS.creative;
    if (options.report) optionCost += baseCost * OPTION_MULTIPLIERS.report;
    optionCost = Math.round(optionCost);

    const totalCost = baseCost + optionCost;

    return { weeklyPrice, baseCost, optionCost, totalCost };
  }, [selectedMedia, weeks, options]);

  const formatKRW = (v: number) =>
    isKo
      ? `${v.toLocaleString("ko-KR")}원`
      : `${v.toLocaleString("en-US")} KRW`;

  function handlePdfDownload() {
    toast.info(t("pdf_coming_soon"));
  }

  function handleSaveQuote() {
    toast.success(t("quote_saved"));
  }

  function handleCopyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    toast.success(t("link_copied"));
  }

  function toggleOption(key: keyof typeof options) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      {/* Left — Form */}
      <div className="space-y-6">
        {/* Media select */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200">
            {t("media_label")}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex h-11 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 hover:border-zinc-600"
            >
              <span className={selectedMedia ? "text-zinc-100" : "text-zinc-500"}>
                {selectedMedia?.mediaName ?? t("media_placeholder")}
              </span>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </button>
            {dropdownOpen && (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
                {medias.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-zinc-500">
                    {t("no_media")}
                  </li>
                ) : (
                  medias.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                        onClick={() => {
                          setSelectedMediaId(m.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <div>
                          <p className="font-medium">{m.mediaName}</p>
                          <p className="text-xs text-zinc-500">
                            {m.category}
                            {m.price != null && ` · ${formatKRW(m.price)}/월`}
                          </p>
                        </div>
                        {selectedMediaId === m.id && (
                          <Check className="h-4 w-4 text-orange-400" />
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Period slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-200">
              {t("period_label")}
            </label>
            <span className="text-sm font-bold text-orange-400">
              {t("period_weeks", { weeks })}
            </span>
          </div>
          <Slider
            min={1}
            max={52}
            step={1}
            value={weeks}
            onValueChange={setWeeks}
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>1{isKo ? "주" : "w"}</span>
            <span>26{isKo ? "주" : "w"}</span>
            <span>52{isKo ? "주" : "w"}</span>
          </div>
        </div>

        {/* Budget slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-200">
              {t("budget_label")}
            </label>
            <span className="text-sm font-bold text-orange-400">
              {(budget * 10000).toLocaleString()}{t("won")}
            </span>
          </div>
          <Slider
            min={100}
            max={10000}
            step={100}
            value={budget}
            onValueChange={setBudget}
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-200">
            {t("options_label")}
          </label>
          <div className="space-y-2">
            {(
              [
                { key: "premium" as const, label: t("option_premium"), pct: "30%" },
                { key: "creative" as const, label: t("option_creative"), pct: "15%" },
                { key: "report" as const, label: t("option_report"), pct: "5%" },
              ] as const
            ).map(({ key, label, pct }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-3 transition-colors hover:border-zinc-600"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={() => toggleOption(key)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 accent-orange-500"
                  />
                  <span className="text-sm text-zinc-200">{label}</span>
                </div>
                <span className="text-xs text-zinc-500">+{pct}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Cost breakdown */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/80 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calculator className="h-5 w-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              {t("estimated_cost")}
            </h3>
          </div>

          {!selectedMedia ? (
            <p className="mt-6 text-center text-sm text-zinc-500">
              {t("select_media_first")}
            </p>
          ) : !calculation ? (
            <p className="mt-6 text-center text-sm text-zinc-500">
              {isKo ? "가격 정보 없음" : "No price info"}
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold tracking-tight text-white">
                  {formatKRW(calculation.totalCost)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatKRW(calculation.weeklyPrice)}{t("per_week")}
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("cost_breakdown")}
                </h4>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">{t("base_cost")}</dt>
                    <dd className="font-medium text-zinc-200">
                      {formatKRW(calculation.baseCost)}
                    </dd>
                  </div>
                  {calculation.optionCost > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">{t("option_cost")}</dt>
                      <dd className="font-medium text-zinc-200">
                        +{formatKRW(calculation.optionCost)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-zinc-800 pt-2">
                    <dt className="font-semibold text-white">{t("total_cost")}</dt>
                    <dd className="font-bold text-orange-400">
                      {formatKRW(calculation.totalCost)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={handlePdfDownload}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            <FileText className="h-4 w-4" />
            {t("download_pdf")}
          </button>
          <button
            type="button"
            onClick={handleSaveQuote}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            <Save className="h-4 w-4" />
            {t("save_quote")}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            <Copy className="h-4 w-4" />
            {t("share_link")}
          </button>
        </div>
      </div>
    </div>
  );
}
