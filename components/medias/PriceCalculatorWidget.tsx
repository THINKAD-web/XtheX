"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";

type Props = {
  mediaId: string;
  mediaName: string;
  price: number | null;
  locale: string;
  contactHref: string;
};

export function PriceCalculatorWidget({
  mediaId,
  mediaName,
  price,
  locale,
  contactHref,
}: Props) {
  const t = useTranslations("priceCalculator");
  const isKo = locale === "ko";
  const [weeks, setWeeks] = useState(4);

  const estimation = useMemo(() => {
    if (price == null) return null;
    const weeklyPrice = Math.round(price / 4);
    const total = weeklyPrice * weeks;
    return { weeklyPrice, total };
  }, [price, weeks]);

  const formatKRW = (v: number) =>
    isKo
      ? `${v.toLocaleString("ko-KR")}원`
      : `${v.toLocaleString("en-US")} KRW`;

  return (
    <article className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        <Calculator className="h-3.5 w-3.5" />
        {t("title")}
      </div>
      <div className="rounded-2xl bg-zinc-900/80 p-5 ring-1 ring-zinc-800">
        {price == null ? (
          <p className="text-sm text-zinc-500">{t("no_price")}</p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{t("period_label")}</span>
                <span className="text-sm font-bold text-orange-400">
                  {t("weeks", { weeks })}
                </span>
              </div>
              <Slider
                min={1}
                max={52}
                step={1}
                value={weeks}
                onValueChange={setWeeks}
              />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>1{isKo ? "주" : "w"}</span>
                <span>26{isKo ? "주" : "w"}</span>
                <span>52{isKo ? "주" : "w"}</span>
              </div>
            </div>

            {estimation && (
              <div className="space-y-2 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{t("monthly_price")}</span>
                  <span>{formatKRW(price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">
                    {t("estimated_total")}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {formatKRW(estimation.total)}
                  </span>
                </div>
              </div>
            )}

            <a
              href={`${contactHref}?weeks=${weeks}&estimated=${estimation?.total ?? 0}`}
              className="flex h-11 w-full items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-400"
            >
              {t("inquiry_btn")}
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
