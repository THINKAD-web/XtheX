"use client";

import { useOmniCart } from "@/hooks/useOmniCart";
import { useLocale } from "next-intl";

type Props = {
  mediaId: string;
  mediaName: string;
  category?: string;
  price?: number | null;
};

const labels: Record<string, string> = {
  ko: "🛒 옴니에 담기",
  ja: "🛒 カートへ",
  zh: "🛒 加入购物车",
};

export function AddToOmniCartButton({ mediaId, mediaName, category, price }: Props) {
  const { add } = useOmniCart();
  const locale = useLocale();
  const label = labels[locale] ?? "🛒 Add to Cart";

  return (
    <button
      type="button"
      onClick={() =>
        add({
          id: mediaId,
          mediaName,
          category,
          priceMin: price ?? null,
          priceMax: price ?? null,
          source: "explore",
        })
      }
      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-300"
    >
      {label}
    </button>
  );
}
