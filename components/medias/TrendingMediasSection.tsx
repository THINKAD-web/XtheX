import Link from "next/link";
import { getTrendingMediasTop5 } from "@/lib/medias/trending";
import { Badge } from "@/components/ui/badge";
import { landing } from "@/lib/landing-theme";

type Props = {
  locale: string;
  titleKo?: string;
  titleEn?: string;
  subtitleKo?: string;
  subtitleEn?: string;
};

export async function TrendingMediasSection({
  locale,
  titleKo = "이번 주 트렌딩 매체 TOP 5",
  titleEn = "Trending media TOP 5",
  subtitleKo = "서울 상권(강남·홍대·여의도 등) 우선으로 정렬합니다.",
  subtitleEn = "Prioritizes Seoul hotspots (Gangnam, Hongdae, Yeouido, etc).",
}: Props) {
  const medias = await getTrendingMediasTop5({ preferSeoul: true });
  const isKo = locale === "ko";

  if (medias.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="home-solid-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {isKo ? titleKo : titleEn}
          </h2>
          <p className="home-solid-lead mt-2 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400">
            {isKo ? subtitleKo : subtitleEn}
          </p>
        </div>
        <Link
          href={`/${locale}/explore`}
          className="home-solid-link shrink-0 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          {isKo ? "탐색으로 이동 →" : "Go to explore →"}
        </Link>
      </div>

      <div className="flex gap-5 overflow-x-auto overflow-y-visible pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700">
        {medias.map((m) => {
          const loc = (m.locationJson ?? {}) as {
            address?: string;
            district?: string;
          };
          return (
            <div
              key={m.id}
              className={`min-w-[280px] max-w-[300px] flex-shrink-0 ${landing.cardDark} p-5`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-50">
                  {m.mediaName}
                </h3>
                <Badge
                  variant="outline"
                  className="shrink-0 border-blue-500/40 bg-blue-500/10 text-xs text-blue-300"
                >
                  {isKo ? "인기" : "Hot"}
                </Badge>
              </div>
              <p className="mt-2 text-pretty text-xs leading-relaxed text-zinc-400">
                {loc.address ?? (isKo ? "주소 정보 없음" : "No address")}
                {loc.district ? ` · ${loc.district}` : ""}
              </p>

              <div className="mt-4 space-y-2 border-t border-zinc-700/50 pt-4 text-sm">
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">CPM</span>
                  <span className="font-medium tabular-nums">
                    {m.cpm != null
                      ? `${m.cpm.toLocaleString()}${isKo ? "원" : " KRW"}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-300">
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
                  className="mt-3 inline-flex text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
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
