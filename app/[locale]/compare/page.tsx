import { prisma } from "@/lib/prisma";
import Link from "next/link";
import React from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { getRecommendedTagCodesForMedia } from "@/lib/compare/recommended-tags";
import { CompareRecommendedTags } from "@/components/compare/CompareRecommendedTags";
import { ComparePerfSimulator } from "@/components/compare/ComparePerfSimulator";
import { CompareCharts } from "@/components/compare/CompareCharts";
import { CompareShareExport } from "@/components/compare/CompareShareExport";
import { RoiCalculatorWidget } from "@/components/roi/RoiCalculatorWidget";
import {
  getBestValueReason,
  getMostTrustedReason,
  getBudgetRecommendation,
} from "@/lib/compare/recommendation-reasons";
import { WeatherHintWithFetch } from "@/components/compare/WeatherHint";
import { CompareCreativeHints } from "@/components/hints/CompareCreativeHints";
import { getBundleRecommendationsForCompare } from "@/lib/medias/similar";
import { SimilarBundleSection } from "@/components/medias/SimilarBundleSection";
import { landing } from "@/lib/landing-theme";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ ids?: string | string[] }>;
};

export async function generateMetadata() {
  const t = await getTranslations("compare");
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function ComparePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const sp = (await searchParams) ?? {};
  const rawIds = sp.ids;
  const idsParam = Array.isArray(rawIds) ? rawIds.join(",") : rawIds ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-background text-zinc-900 dark:text-zinc-50">
        <section className={landing.section}>
          <div className={landing.container}>
            <div className={`${landing.card} mx-auto max-w-xl space-y-6 hover:scale-100`}>
              <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
                {isKo ? "비교할 매체가 없습니다" : "No media selected for comparison"}
              </h2>
              <p className="text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
                {isKo
                  ? "/explore에서 매체 카드의 ‘비교’ 버튼을 눌러 최대 3개까지 선택한 뒤, 비교하기 버튼을 눌러보세요."
                  : "On /explore, choose up to 3 media using the 'Compare' button, then press 'Compare'."}
              </p>
              <Link href={`/${locale}/explore`} className={landing.btnPrimary}>
                {isKo ? "매체 탐색으로 돌아가기" : "Back to explore"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const medias = await prisma.media.findMany({
    where: {
      id: { in: ids },
    },
    select: {
      id: true,
      mediaName: true,
      description: true,
      category: true,
      price: true,
      cpm: true,
      trustScore: true,
      locationJson: true,
      exposureJson: true,
      images: true,
      pros: true,
      cons: true,
      targetAudience: true,
    },
  });

  const mediasWithLocale = medias.map((m) => ({
    ...m,
    displayName: m.mediaName,
    displayDescription: m.description ?? "",
  }));

  const numericPrices = mediasWithLocale
    .map((m) => m.price)
    .filter((p): p is number => p != null);
  const numericCpms = mediasWithLocale
    .map((m) => m.cpm)
    .filter((p): p is number => p != null);

  const minPrice = numericPrices.length ? Math.min(...numericPrices) : null;
  const maxPrice = numericPrices.length ? Math.max(...numericPrices) : null;
  const minCpm = numericCpms.length ? Math.min(...numericCpms) : null;
  const avgCpm = numericCpms.length
    ? Math.round(numericCpms.reduce((a, b) => a + b, 0) / numericCpms.length)
    : null;

  const bestPrice =
    mediasWithLocale.length > 0
      ? mediasWithLocale.reduce((min, m) => {
          if (m.price == null) return min;
          if (min == null || (m.price ?? 0) < (min.price ?? 0)) return m;
          return min;
        }, null as (typeof mediasWithLocale)[number] | null)
      : null;

  const bestTrust =
    mediasWithLocale.length > 0
      ? mediasWithLocale.reduce((max, m) => {
          if (m.trustScore == null) return max;
          if (max == null || (m.trustScore ?? 0) > (max.trustScore ?? 0))
            return m;
          return max;
        }, null as (typeof mediasWithLocale)[number] | null)
      : null;

  if (mediasWithLocale.length === 0) {
    return (
      <div className="min-h-screen bg-background text-zinc-900 dark:text-zinc-50">
        <section className={landing.section}>
          <div className={landing.container}>
            <div className={`${landing.card} mx-auto max-w-xl space-y-6 hover:scale-100`}>
              <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
                {isKo ? "비교할 매체를 찾을 수 없습니다" : "No matching media found"}
              </h2>
              <Link href={`/${locale}/explore`} className={landing.btnPrimary}>
                {isKo ? "매체 탐색으로 돌아가기" : "Back to explore"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const attributes = [
    { key: "category", labelKo: "카테고리", labelEn: "Category" },
    { key: "location", labelKo: "위치", labelEn: "Location" },
    { key: "thumbnail", labelKo: "대표 이미지", labelEn: "Visual" },
    { key: "price", labelKo: "가격", labelEn: "Price" },
    { key: "cpm", labelKo: "CPM", labelEn: "CPM" },
    { key: "targetAudience", labelKo: "타깃", labelEn: "Audience" },
    { key: "exposure", labelKo: "노출/트래픽", labelEn: "Exposure" },
    { key: "pros", labelKo: "장점", labelEn: "Strengths" },
    { key: "cons", labelKo: "유의사항", labelEn: "Cautions" },
    { key: "trustScore", labelKo: "신뢰도", labelEn: "Trust score" },
  ] as const;

  const locs = mediasWithLocale.map((m) => (m.locationJson ?? {}) as any);
  const exposures = mediasWithLocale.map((m) => (m.exposureJson ?? {}) as any);

  const recommendedByMediaId: Record<string, string[]> = {};
  const allCodes = new Set<string>();
  mediasWithLocale.forEach((m) => {
    const codes = getRecommendedTagCodesForMedia(m.displayName, m.category);
    recommendedByMediaId[m.id] = codes;
    codes.forEach((c) => allCodes.add(c));
  });
  const tagLabels = await prisma.tag
    .findMany({
      where: { code: { in: Array.from(allCodes) } },
      select: { code: true, ko: true, en: true },
    })
    .then((rows) =>
      rows.map((r) => ({ code: r.code, labelKo: r.ko, labelEn: r.en })),
    );

  const bundleItems = await getBundleRecommendationsForCompare({ mediaIds: ids });

  const mediaLikeForReasons = mediasWithLocale.map((m) => ({
    mediaName: m.displayName,
    price: m.price,
    trustScore: m.trustScore,
  }));

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className={`flex h-14 items-center justify-between text-zinc-50 ${landing.container}`}>
          <Link
            href={`/${locale}`}
            className="text-lg font-bold tracking-tight text-zinc-50"
          >
            XtheX
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="min-h-screen bg-background pb-24 pt-20 text-zinc-900 dark:text-zinc-50">
        <section className={landing.section}>
          <div className={landing.container}>
            <div className={landing.sectionStack}>
          <header className="flex flex-wrap items-center justify-between gap-6 lg:gap-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
                {isKo ? "매체 비교" : "Media comparison"}
              </h2>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
                {isKo
                  ? "최대 3개 매체를 한 눈에 비교합니다."
                  : "Compare up to 3 media side by side."}
              </p>
              {(minPrice != null || maxPrice != null || minCpm != null) && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-700">
                  {minPrice != null && maxPrice != null && (
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 shadow-sm">
                      {isKo ? "총 예산 범위" : "Total price range"}:{" "}
                      {minPrice.toLocaleString()} ~ {maxPrice.toLocaleString()}
                      {isKo ? "원" : " KRW"}
                    </span>
                  )}
                  {minCpm != null && (
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 shadow-sm">
                      {isKo ? "최소 CPM" : "Lowest CPM"}:{" "}
                      {minCpm.toLocaleString()}
                      {isKo ? "원" : " KRW"}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CompareShareExport ids={ids} locale={locale} />
              <Link
                href={`/${locale}/explore`}
                className={landing.btnSecondary + " min-w-0 shrink-0 px-5"}
              >
                {isKo ? "매체 탐색으로 돌아가기" : "Back to explore"}
              </Link>
            </div>
          </header>

          <WeatherHintWithFetch
            locale={locale}
            city="Seoul,KR"
            className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          />
          <CompareCreativeHints
            locale={locale}
            medias={mediasWithLocale.map((m) => ({
              mediaName: m.displayName,
              category: m.category,
            }))}
            className="mb-4"
            tone="light"
          />

          <div className={`overflow-x-auto ${landing.surface} p-4 sm:p-6`}>
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-40 py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {isKo ? "항목" : "Attribute"}
                  </th>
                  {mediasWithLocale.map((m) => (
                    <th
                      key={m.id}
                      className="min-w-[180px] py-3 pl-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600"
                    >
                      <Link
                        href={`/${locale}/medias/${m.id}`}
                        className="line-clamp-2 text-sm font-semibold text-zinc-900 hover:text-orange-600 hover:underline"
                      >
                        {m.displayName}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr) => (
                  <tr key={attr.key} className="border-t border-zinc-200">
                    <td className="py-3 pr-4 align-top text-xs font-medium text-zinc-600">
                      {isKo ? attr.labelKo : attr.labelEn}
                    </td>
                    {mediasWithLocale.map((m, idx) => {
                      const loc = locs[idx];
                      const exp = exposures[idx];
                      let content: React.ReactNode = null;

                      switch (attr.key) {
                        case "category":
                          content = m.category;
                          break;
                        case "thumbnail":
                          content =
                            m.images && m.images.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.images[0]}
                                alt={m.displayName || "media"}
                                className="h-20 w-full max-w-[140px] rounded-md object-cover"
                              />
                            ) : (
                              <span className="text-xs text-zinc-500">
                                {isKo ? "이미지 없음" : "No image"}
                              </span>
                            );
                          break;
                        case "location":
                          content = (
                            <>
                              <div>
                                {loc.address ??
                                  (isKo ? "주소 정보 없음" : "No address")}
                              </div>
                              {loc.district && (
                                <div className="text-xs text-zinc-500">
                                  {loc.district}
                                </div>
                              )}
                            </>
                          );
                          break;
                        case "price":
                          content =
                            m.price != null
                              ? `${m.price.toLocaleString()}${isKo ? "원" : " KRW"}`
                              : isKo
                                ? "가격 협의"
                                : "Price on request";
                          break;
                        case "cpm":
                          content =
                            m.cpm != null
                              ? `${m.cpm.toLocaleString()}${isKo ? "원" : " KRW"}`
                              : "—";
                          break;
                        case "targetAudience":
                          content =
                            m.targetAudience ??
                            (isKo ? "타깃 정보 없음" : "No audience info");
                          break;
                        case "exposure":
                          content = (
                            <ul className="space-y-1 text-xs text-zinc-600">
                              {exp.daily_traffic && (
                                <li>
                                  {isKo ? "일일 유동인구" : "Daily traffic"}:{" "}
                                  {exp.daily_traffic}
                                </li>
                              )}
                              {exp.monthly_impressions && (
                                <li>
                                  {isKo ? "월 노출 수" : "Monthly impressions"}:{" "}
                                  {exp.monthly_impressions}
                                </li>
                              )}
                              {exp.reach && (
                                <li>
                                  {isKo ? "도달률" : "Reach"}: {exp.reach}
                                </li>
                              )}
                              {exp.frequency && (
                                <li>
                                  {isKo ? "빈도" : "Frequency"}: {exp.frequency}
                                </li>
                              )}
                              {!exp.daily_traffic &&
                                !exp.monthly_impressions &&
                                !exp.reach &&
                                !exp.frequency && (
                                  <li>
                                    {isKo ? "데이터 없음" : "No data"}
                                  </li>
                                )}
                            </ul>
                          );
                          break;
                        case "pros":
                          content =
                            m.pros ??
                            (isKo
                              ? "등록된 장점이 없습니다."
                              : "No strengths");
                          break;
                        case "cons":
                          content =
                            m.cons ??
                            (isKo
                              ? "등록된 유의사항이 없습니다."
                              : "No cautions");
                          break;
                        case "trustScore":
                          content =
                            m.trustScore != null
                              ? `${m.trustScore}/100`
                              : isKo
                                ? "미측정"
                                : "Not measured";
                          break;
                      }

                      return (
                        <td
                          key={m.id}
                          className="py-3 pl-4 align-top text-sm text-zinc-800"
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <CompareRecommendedTags
                  medias={mediasWithLocale.map((m) => ({
                    id: m.id,
                    mediaName: m.displayName,
                    category: m.category,
                  }))}
                  recommendedByMediaId={recommendedByMediaId}
                  tagLabels={tagLabels}
                  locale={locale}
                  explorePath={`/${locale}/explore`}
                />
              </tbody>
            </table>
          </div>

          <section className="space-y-6 lg:space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 lg:text-2xl">
                {isKo ? "간단 비교 통계" : "Quick comparison stats"}
              </h3>
              <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-base">
                {isKo
                  ? "가격과 신뢰도 기준으로 한눈에 추천을 보여줍니다."
                  : "Highlights the best options by price and trust score."}
              </p>
            </div>

            <div className={landing.grid2}>
              <div className={landing.card}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isKo ? "가성비 추천" : "Best value"}
                </h4>
                {bestPrice ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium text-zinc-900">
                      {bestPrice.displayName}
                    </p>
                    <p className="text-zinc-600">
                      {isKo ? "대략 가격" : "Approx. price"}:{" "}
                      {bestPrice.price != null
                        ? `${bestPrice.price.toLocaleString()}${isKo ? "원" : " KRW"}`
                        : isKo
                          ? "가격 정보 없음"
                          : "No price info"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {getBestValueReason(
                        {
                          mediaName: bestPrice.displayName,
                          price: bestPrice.price,
                        },
                        locale,
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    {isKo
                      ? "가격 비교 가능한 매체가 없습니다."
                      : "No media with price to compare."}
                  </p>
                )}
              </div>

              <div className={landing.card}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isKo ? "신뢰도 추천" : "Most trusted"}
                </h4>
                {bestTrust ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium text-zinc-900">
                      {bestTrust.displayName}
                    </p>
                    <p className="text-zinc-600">
                      {isKo ? "신뢰도 점수" : "Trust score"}:{" "}
                      {bestTrust.trustScore != null
                        ? `${bestTrust.trustScore}/100`
                        : "—"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {getMostTrustedReason(
                        {
                          mediaName: bestTrust.displayName,
                          trustScore: bestTrust.trustScore,
                        },
                        locale,
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    {isKo
                      ? "신뢰도 점수가 등록된 매체가 없습니다."
                      : "No media with trust score to compare."}
                  </p>
                )}
              </div>
            </div>

            <div className={landing.panel}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {isKo ? "예산별 추천 조합" : "Recommendation by budget"}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                <li>
                  &lt; 3천만 {isKo ? "원" : " KRW"}:{" "}
                  {getBudgetRecommendation(
                    25_000_000,
                    mediaLikeForReasons,
                    bestPrice
                      ? {
                          mediaName: bestPrice.displayName,
                          price: bestPrice.price,
                        }
                      : null,
                    bestTrust
                      ? {
                          mediaName: bestTrust.displayName,
                          trustScore: bestTrust.trustScore,
                        }
                      : null,
                    locale,
                  )}
                </li>
                <li>
                  3천만 ~ 1억 {isKo ? "원" : " KRW"}:{" "}
                  {getBudgetRecommendation(
                    50_000_000,
                    mediaLikeForReasons,
                    bestPrice
                      ? {
                          mediaName: bestPrice.displayName,
                          price: bestPrice.price,
                        }
                      : null,
                    bestTrust
                      ? {
                          mediaName: bestTrust.displayName,
                          trustScore: bestTrust.trustScore,
                        }
                      : null,
                    locale,
                  )}
                </li>
                <li>
                  ≥ 1억 {isKo ? "원" : " KRW"}:{" "}
                  {getBudgetRecommendation(
                    150_000_000,
                    mediaLikeForReasons,
                    bestPrice
                      ? {
                          mediaName: bestPrice.displayName,
                          price: bestPrice.price,
                        }
                      : null,
                    bestTrust
                      ? {
                          mediaName: bestTrust.displayName,
                          trustScore: bestTrust.trustScore,
                        }
                      : null,
                    locale,
                  )}
                </li>
              </ul>
            </div>
          </section>

          <section>
            <ComparePerfSimulator
              medias={mediasWithLocale.map((m) => ({
                id: m.id,
                mediaName: m.displayName,
                price: m.price,
                cpm: m.cpm,
                exposureJson: m.exposureJson,
              }))}
              locale={locale}
            />
          </section>

          <section>
            <RoiCalculatorWidget
              locale={locale}
              avgCpm={avgCpm}
              mediaCount={mediasWithLocale.length}
              surface="light"
            />
          </section>

          <section>
            <CompareCharts
              medias={mediasWithLocale.map((m) => ({
                id: m.id,
                mediaName: m.displayName,
                price: m.price,
                cpm: m.cpm,
                trustScore: m.trustScore,
                exposureJson: m.exposureJson,
                pros: m.pros,
              }))}
              locale={locale}
            />
          </section>

          <SimilarBundleSection
            locale={locale}
            baseMediaIds={ids}
            items={bundleItems}
            surface="light"
            titleKo="추천 번들 조합"
            titleEn="Recommended bundle"
            subtitleKo="비교 중인 매체와 유사한 효과가 예상되는 매체 3개를 추천합니다."
            subtitleEn="3 more media with similar expected effect to your comparison."
          />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
