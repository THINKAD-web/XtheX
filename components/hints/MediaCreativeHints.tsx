"use client";

import * as React from "react";
import { CreativeHintsPopup } from "@/components/hints/CreativeHintsPopup";
import { getRecommendedTagCodesForMedia } from "@/lib/compare/recommended-tags";

type Props = {
  locale: string;
  mediaId: string;
  mediaName: string;
  mediaCategory: string;
  targetAudienceText?: string | null;
};

export function MediaCreativeHints({
  locale,
  mediaId,
  mediaName,
  mediaCategory,
  targetAudienceText,
}: Props) {
  const [weatherMain, setWeatherMain] = React.useState<string | undefined>(undefined);
  const [hour, setHour] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    setHour(new Date().getHours());
    // optional weather context (free API + cache). If it fails, hints still work.
    fetch(`/api/weather?city=${encodeURIComponent("Seoul,KR")}`)
      .then((r) => r.json())
      .then((d) => setWeatherMain(d?.condition))
      .catch(() => setWeatherMain(undefined));
  }, []);

  const tagCodes = React.useMemo(
    () => getRecommendedTagCodesForMedia(mediaName, mediaCategory),
    [mediaName, mediaCategory],
  );

  return (
    <CreativeHintsPopup
      locale={locale}
      context={{
        tagCodes,
        targetAudienceText: targetAudienceText ?? null,
        mediaName,
        mediaCategory,
        weatherMain,
        hour,
      }}
      className="rounded-2xl"
      compact
    />
  );
}

