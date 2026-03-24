"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";
import type { TrendingMedia } from "@/lib/medias/trending";

type Props = {
  locale: string;
  medias: TrendingMedia[];
  titleKo?: string;
  titleEn?: string;
  subtitleKo?: string;
  subtitleEn?: string;
};

export function TrendingMediasCarouselClient({
  locale,
  medias,
  titleKo = "이번 주 트렌딩 매체 TOP 5",
  titleEn = "Trending media TOP 5",
  subtitleKo = "서울 상권(강남·홍대·여의도 등) 우선으로 정렬합니다.",
  subtitleEn = "Prioritizes Seoul hotspots (Gangnam, Hongdae, Yeouido, etc).",
}: Props) {
  const isDay = useLandingLightChrome();
  const isKo = locale === "ko";

  const cardClass = isDay
    ? "rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/60"
    : landing.cardDark;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            className={cn(
              "home-solid-heading text-3xl font-bold tracking-tight sm:text-4xl",
              isDay ? "text-zinc-900" : "text-zinc-50",
            )}
          >
            {isKo ? titleKo : titleEn}
          </h2>
          <p
            className={cn(
              "home-solid-lead mt-2 max-w-2xl text-pretty text-base leading-relaxed",
              isDay ? "text-zinc-600" : "text-zinc-400",
            )}
          >
            {isKo ? subtitleKo : subtitleEn}
          </p>
        </div>
        <Link
          href={`/${locale}/explore`}
          className={cn(
            "home-solid-link shrink-0 text-sm font-medium transition-colors",
            isDay
              ? "text-blue-600 hover:text-blue-700"
              : "text-blue-400 hover:text-blue-300",
          )}
        >
          {isKo ? "탐색으로 이동 →" : "Go to explore →"}
        </Link>
      </div>

      <div
        className={cn(
          "flex gap-5 overflow-x-auto overflow-y-visible pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full",
          isDay
            ? "[&::-webkit-scrollbar-thumb]:bg-zinc-300"
            : "[&::-webkit-scrollbar-thumb]:bg-zinc-700",
        )}
      >
        {medias.map((m) => {
          const loc = (m.locationJson ?? {}) as {
            address?: string;
            district?: string;
          };
          return (
            <div key={m.id} className={cn(cardClass, "min-w-[280px] max-w-[300px] flex-shrink-0")}>
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    "line-clamp-2 text-base font-semibold leading-snug",
                    isDay ? "text-zinc-900" : "text-zinc-50",
                  )}
                >
                  {m.mediaName}
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 border-blue-500/40 text-xs",
                    isDay
                      ? "bg-blue-50 text-blue-800"
                      : "bg-blue-500/10 text-blue-300",
                  )}
                >
                  {isKo ? "인기" : "Hot"}
                </Badge>
              </div>
              <p
                className={cn(
                  "mt-2 text-pretty text-xs leading-relaxed",
                  isDay ? "text-zinc-600" : "text-zinc-400",
                )}
              >
                {loc.address ?? (isKo ? "주소 정보 없음" : "No address")}
                {loc.district ? ` · ${loc.district}` : ""}
              </p>

              <div
                className={cn(
                  "mt-4 space-y-2 border-t pt-4 text-sm",
                  isDay ? "border-zinc-200" : "border-zinc-700/50",
                )}
              >
                <div
                  className={cn(
                    "flex justify-between",
                    isDay ? "text-zinc-700" : "text-zinc-300",
                  )}
                >
                  <span className="text-zinc-500">CPM</span>
                  <span className="font-medium tabular-nums">
                    {m.cpm != null
                      ? `${m.cpm.toLocaleString()}${isKo ? "원" : " KRW"}`
                      : "—"}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex justify-between",
                    isDay ? "text-zinc-700" : "text-zinc-300",
                  )}
                >
                  <span className="text-zinc-500">
                    {isKo ? "신뢰도" : "Trust"}
                  </span>
                  <span className="font-medium tabular-nums">
                    {m.trustScore != null ? `${m.trustScore}/100` : "—"}
                  </span>
                </div>
                {typeof m.viewCount === "number" ? (
                  <div className="flex justify-between text-zinc-500">
                    <span>{isKo ? "조회" : "Views"}</span>
                    <span className="tabular-nums">
                      {m.viewCount.toLocaleString()}
                    </span>
                  </div>
                ) : null}

                <Link
                  href={`/${locale}/medias/${m.id}`}
                  className={cn(
                    "mt-3 inline-flex text-sm font-medium transition-colors",
                    isDay
                      ? "text-blue-600 hover:text-blue-700"
                      : "text-blue-400 hover:text-blue-300",
                  )}
                >
                  {isKo ? "상세 보기 →" : "View details →"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
