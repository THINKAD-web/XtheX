import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BundleCampaignCTA } from "@/components/medias/BundleCampaignCTA";
import type { SimilarMediaCard } from "@/lib/medias/similar";

type Props = {
  locale: string;
  titleKo?: string;
  titleEn?: string;
  subtitleKo?: string;
  subtitleEn?: string;
  baseMediaIds: string[]; // bundle to create campaign
  items: SimilarMediaCard[];
  /** "light" matches explore/compare daytime UI */
  surface?: "dark" | "light";
};

export function SimilarBundleSection({
  locale,
  titleKo = "추천 번들 조합",
  titleEn = "Recommended bundle",
  subtitleKo = "비슷한 효과가 예상되는 매체 3개를 추천합니다.",
  subtitleEn = "3 media with similar expected effect.",
  baseMediaIds,
  items,
  surface = "dark",
}: Props) {
  const isKo = locale === "ko";
  const light = surface === "light";
  if (items.length === 0) return null;

  return (
    <section className="mt-10 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className={
              light
                ? "text-lg font-semibold text-zinc-900"
                : "text-lg font-semibold text-zinc-100"
            }
          >
            {isKo ? titleKo : titleEn}
          </h2>
          <p className={light ? "text-sm text-zinc-600" : "text-sm text-zinc-400"}>
            {isKo ? subtitleKo : subtitleEn}
          </p>
        </div>
        <BundleCampaignCTA locale={locale} mediaIds={[...baseMediaIds, ...items.map((i) => i.id)]} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((m) => {
          const loc = (m.locationJson ?? {}) as any;
          return (
            <Card
              key={m.id}
              className={
                light
                  ? "border-zinc-200 bg-white text-zinc-900 shadow-sm"
                  : "border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none"
              }
            >
              <CardHeader className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-base">
                    {m.mediaName}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      light
                        ? "border-orange-300 bg-orange-50 text-orange-800"
                        : "border-orange-500/50 bg-orange-500/10 text-orange-200"
                    }
                  >
                    {isKo ? "추천" : "Bundle"}
                  </Badge>
                </div>
                <p className={light ? "text-xs text-zinc-600" : "text-xs text-zinc-400"}>
                  {loc.address ?? (isKo ? "주소 정보 없음" : "No address")}
                  {loc.district ? ` · ${loc.district}` : ""}
                </p>
              </CardHeader>

              <CardContent className="space-y-2 p-4 pt-0 text-sm">
                <div
                  className={
                    light ? "flex justify-between text-zinc-700" : "flex justify-between text-zinc-300"
                  }
                >
                  <span>{isKo ? "가격" : "Price"}</span>
                  <span className="font-medium">
                    {m.price != null
                      ? `${m.price.toLocaleString()}${isKo ? "원" : " KRW"}`
                      : "—"}
                  </span>
                </div>
                <div
                  className={
                    light ? "flex justify-between text-zinc-700" : "flex justify-between text-zinc-300"
                  }
                >
                  <span>CPM</span>
                  <span className="font-medium">
                    {m.cpm != null
                      ? `${m.cpm.toLocaleString()}${isKo ? "원" : " KRW"}`
                      : "—"}
                  </span>
                </div>
                <div
                  className={
                    light ? "flex justify-between text-zinc-700" : "flex justify-between text-zinc-300"
                  }
                >
                  <span>{isKo ? "신뢰도" : "Trust"}</span>
                  <span className="font-medium">
                    {m.trustScore != null ? `${m.trustScore}/100` : "—"}
                  </span>
                </div>
                {m.pros ? (
                  <p
                    className={
                      light
                        ? "mt-2 line-clamp-2 text-xs text-zinc-500"
                        : "mt-2 line-clamp-2 text-xs text-zinc-500"
                    }
                  >
                    {m.pros}
                  </p>
                ) : null}

                <Link
                  href={`/${locale}/medias/${m.id}`}
                  className={
                    light
                      ? "mt-2 inline-flex text-sm font-medium text-orange-600 hover:underline"
                      : "mt-2 inline-flex text-sm font-medium text-orange-400 hover:underline"
                  }
                >
                  {isKo ? "상세 보기 →" : "View details →"}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

