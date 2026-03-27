"use client";

import { useOmniCart } from "@/hooks/useOmniCart";
import { useLocale } from "next-intl";

type Media = {
  id: string;
  mediaName: string;
  category?: string;
  price?: number | null;
};

export function CompareOmniCartRow({
  medias,
  locale,
}: {
  medias: Media[];
  locale: string;
}) {
  const { add } = useOmniCart();
  const currentLocale = useLocale();
  const isKo = (locale || currentLocale) === "ko";

  return (
    <tr className="border-t border-border">
      <td className="py-4 pr-4 align-top text-xs font-medium text-muted-foreground">
        {isKo ? "옴니카트" : "OmniCart"}
      </td>
      {medias.map((m) => (
        <td key={m.id} className="py-4 pl-4 align-top">
          <button
            type="button"
            onClick={() =>
              add({
                id: m.id,
                mediaName: m.mediaName,
                category: m.category,
                priceMin: m.price ?? null,
                priceMax: m.price ?? null,
                source: "explore",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-300"
          >
            🛒 {isKo ? "옴니에 담기" : "Add to Cart"}
          </button>
        </td>
      ))}
    </tr>
  );
}
