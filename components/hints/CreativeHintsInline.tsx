"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CreativeHintsPopup } from "@/components/hints/CreativeHintsPopup";
import { getCreativeHints, type CreativeHintContext } from "@/lib/hints/creatives";

type Props = {
  locale: string;
  context: CreativeHintContext;
  maxBadges?: number;
  className?: string;
};

export function CreativeHintsInline({
  locale,
  context,
  maxBadges = 2,
  className,
}: Props) {
  const hints = React.useMemo(() => getCreativeHints(context), [context]);
  if (hints.length === 0) return null;

  const isKo = locale === "ko";
  const top = hints.slice(0, maxBadges);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        {top.map((h) => (
          <Badge
            key={h.id}
            variant="outline"
            className="border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-[11px] font-normal text-orange-200"
          >
            {isKo ? h.titleKo : h.titleEn}
          </Badge>
        ))}
        <CreativeHintsPopup
          locale={locale}
          context={context}
          compact
          variant="button"
        />
      </div>
    </div>
  );
}

