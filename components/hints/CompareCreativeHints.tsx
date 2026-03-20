"use client";

import * as React from "react";
import { CreativeHintsPopup } from "@/components/hints/CreativeHintsPopup";
import { getRecommendedTagCodesForMedia } from "@/lib/compare/recommended-tags";

type MediaLike = { mediaName: string; category: string };

type Props = {
  locale: string;
  medias: MediaLike[];
  className?: string;
  tone?: "dark" | "light";
};

export function CompareCreativeHints({ locale, medias, className, tone = "dark" }: Props) {
  const [weatherMain, setWeatherMain] = React.useState<string | undefined>(undefined);
  const [hour, setHour] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    setHour(new Date().getHours());
    fetch(`/api/weather?city=${encodeURIComponent("Seoul,KR")}`)
      .then((r) => r.json())
      .then((d) => setWeatherMain(d?.condition))
      .catch(() => setWeatherMain(undefined));
  }, []);

  const tagCodes = React.useMemo(() => {
    const s = new Set<string>();
    medias.forEach((m) => {
      getRecommendedTagCodesForMedia(m.mediaName, m.category).forEach((c) => s.add(c));
    });
    return Array.from(s);
  }, [medias]);

  const mediaName =
    medias.length === 1
      ? medias[0]?.mediaName
      : medias.length > 1
        ? `${medias[0]?.mediaName} 외 ${medias.length - 1}개`
        : undefined;

  return (
    <CreativeHintsPopup
      locale={locale}
      context={{ tagCodes, weatherMain, hour, mediaName }}
      className={className}
      tone={tone}
    />
  );
}

