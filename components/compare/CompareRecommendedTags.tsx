"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type TagLabel = { code: string; labelKo: string; labelEn: string };

type MediaItem = { id: string; mediaName: string; category: string };

type Props = {
  medias: MediaItem[];
  recommendedByMediaId: Record<string, string[]>;
  tagLabels: TagLabel[];
  locale: string;
  explorePath: string;
};

export function CompareRecommendedTags({
  medias,
  recommendedByMediaId,
  tagLabels,
  locale,
  explorePath,
}: Props) {
  const isKo = locale === "ko";
  const labelByCode = React.useMemo(() => {
    const m: Record<string, string> = {};
    tagLabels.forEach((t) => {
      m[t.code] = isKo ? t.labelKo : t.labelEn;
    });
    return m;
  }, [tagLabels, isKo]);

  return (
    <tr className="border-t border-border">
      <td className="py-3 pr-4 align-top text-xs font-medium text-muted-foreground">
        {isKo ? "이 매체 추천 타겟팅" : "Recommended targeting"}
      </td>
      {medias.map((m) => {
        const codes = recommendedByMediaId[m.id] ?? [];
        return (
          <td key={m.id} className="py-3 pl-4 align-top">
            <div className="flex flex-wrap gap-1.5">
              {codes.map((code) => {
                const label = labelByCode[code] ?? code;
                const search = new URLSearchParams();
                search.set("ids", medias.map((x) => x.id).join(","));
                search.set("addTag", code);
                return (
                  <Link
                    key={code}
                    href={`${explorePath}?${search.toString()}`}
                    className="inline-block"
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-orange-300 bg-orange-50 px-2 py-0.5 text-[11px] font-normal text-orange-800 hover:border-orange-400 hover:bg-orange-100"
                    >
                      {label}
                    </Badge>
                  </Link>
                );
              })}
              {codes.length === 0 && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
