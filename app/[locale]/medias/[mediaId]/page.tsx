import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { appMainContainerClass } from "@/lib/layout/app-chrome";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { OmnichannelTrigger } from "@/components/campaign/OmnichannelTrigger";
import { SaveInterestButton } from "@/components/medias/SaveInterestButton";
import { MediaGallery } from "@/components/medias/MediaGallery";
import { MediaCaseStudies } from "@/components/medias/MediaCaseStudies";
import { ViewCountTracker } from "@/components/medias/ViewCountTracker";
import { MediaCreativeHints } from "@/components/hints/MediaCreativeHints";
import { getSimilarMediasForMedia } from "@/lib/medias/similar";
import { SimilarBundleSection } from "@/components/medias/SimilarBundleSection";
import { AddToOmniCartButton } from "@/components/medias/AddToOmniCartButton";
import { ShareButtons } from "@/components/medias/ShareButtons";
import {
  convertCurrency,
  formatCurrency,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency";

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|mov|m4v)$/i.test(url) || url.includes("youtube.com") || url.includes("youtu.be");

/** Media.id is @db.Uuid — non-UUID strings cause Prisma/Postgres to throw. */
function isMediaUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id.trim(),
  );
}

type PageProps = {
  params: Promise<{ locale: string; mediaId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, mediaId } = await params;
  if (!isMediaUuid(mediaId)) {
    return {
      title: "Media Detail | XtheX",
      description: "Published media detail page.",
      robots: { index: false, follow: false },
    };
  }
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: {
      status: true,
      mediaName: true,
      description: true,
      sampleImages: true,
      images: true,
    },
  });
  if (!media || media.status !== "PUBLISHED") {
    return {
      title: "Media Detail | XtheX",
      description: "Published media detail page.",
      robots: { index: false, follow: false },
    };
  }
  const candidateImages = [...(media.sampleImages ?? []), ...(media.images ?? [])];
  const firstImage = candidateImages.find((u) => /^https?:\/\//i.test(String(u).trim())) ?? "/og-image.png";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://xthex.com";
  const absoluteImage = firstImage.startsWith("http")
    ? firstImage
    : `${appUrl.replace(/\/$/, "")}${firstImage.startsWith("/") ? "" : "/"}${firstImage}`;

  return {
    title: `${media.mediaName} | XtheX`,
    description:
      media.description?.slice(0, 150) ||
      (locale === "ko"
        ? "XtheX 공개 매체 상세 정보"
        : "XtheX published media detail"),
    openGraph: {
      title: `${media.mediaName} | XtheX`,
      description:
        media.description?.slice(0, 150) ||
        (locale === "ko"
          ? "XtheX 공개 매체 상세 정보"
          : "XtheX published media detail"),
      images: [{ url: absoluteImage }],
    },
  };
}

export default async function MediaDetailPage({ params, searchParams }: PageProps) {
  const { locale, mediaId } = await params;
  const sp = (await searchParams) ?? {};
  const isKo = locale === "ko";
  const t = await getTranslations("publicMediaDetail");
  const cookieStore = await cookies();
  const cookieCurrency = cookieStore.get("xthex_currency")?.value ?? "";
  const displayCurrency: SupportedCurrency = isSupportedCurrency(cookieCurrency)
    ? cookieCurrency
    : isKo
      ? "KRW"
      : "USD";

  if (!isMediaUuid(mediaId)) {
    return (
      <AppSiteChrome mainClassName="min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-50">
        <div className={`${appMainContainerClass} max-w-3xl py-12`}>
          <p className="text-sm text-zinc-500">{t("not_found")}</p>
          <Link
            href={`/${locale}/explore`}
            className="mt-4 inline-flex text-sm text-orange-400 hover:underline"
          >
            ← {t("back_to_explore")}
          </Link>
        </div>
      </AppSiteChrome>
    );
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: {
      id: true,
      status: true,
      mediaName: true,
      description: true,
      category: true,
      price: true,
      cpm: true,
      images: true,
      sampleImages: true,
      locationJson: true,
      exposureJson: true,
      pros: true,
      cons: true,
      targetAudience: true,
      tags: true,
      trustScore: true,
    },
  });

  if (!media || media.status !== "PUBLISHED") {
    return (
      <AppSiteChrome mainClassName="min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-50">
        <div className={`${appMainContainerClass} max-w-3xl py-12`}>
          <p className="text-sm text-zinc-500">{t("not_found")}</p>
          <Link
            href={`/${locale}/explore`}
            className="mt-4 inline-flex text-sm text-orange-400 hover:underline"
          >
            ← {t("back_to_explore")}
          </Link>
        </div>
      </AppSiteChrome>
    );
  }

  const location = (media.locationJson ?? {}) as any;
  const exposure = (media.exposureJson ?? {}) as any;
  const sampleHttp = (media.sampleImages ?? []).filter((u) =>
    /^https?:\/\//i.test(String(u).trim()),
  );
  const fromImages = (media.images ?? []).filter((u) => !isVideoUrl(u));
  const imageUrls = [...sampleHttp, ...fromImages].slice(0, 8);
  const videoUrls = (media.images ?? []).filter((u) => isVideoUrl(u));

  const heroImage = sampleHttp[0] ?? fromImages.find((u) => /^https?:\/\//i.test(u)) ?? "/og-image.png";

  const inquiryCountPromise =
    typeof (prisma as any).inquiry?.count === "function"
      ? (prisma as any).inquiry.count({
          where: { mediaId: media.id },
        })
      : Promise.resolve(0);

  const [similarMedias, inquiryCount] = await Promise.all([
    prisma.media.findMany({
      where: {
        id: { not: media.id },
        status: "PUBLISHED",
        category: media.category,
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    inquiryCountPromise,
  ]);

  const inquiryStatus =
    typeof sp.inquiry === "string" ? sp.inquiry : undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://xthex.com";
  const pageUrl = `${appUrl}/${locale}/medias/${media.id}`;
  const shareText = encodeURIComponent(`${media.mediaName} - XtheX`);
  const shareUrl = encodeURIComponent(pageUrl);
  const xShare = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const kakaoShare = `https://story.kakao.com/share?url=${shareUrl}`;
  const convertedPrice =
    media.price != null ? convertCurrency(media.price, "KRW", displayCurrency) : null;
  const displayPriceLabel =
    convertedPrice == null
      ? t("price_on_request")
      : formatCurrency(convertedPrice, displayCurrency, isKo ? "ko-KR" : "en-US");

  const similarEffectMedias = await getSimilarMediasForMedia({
    id: media.id,
    mediaName: media.mediaName,
    category: media.category,
    locationJson: media.locationJson,
    cpm: media.cpm ?? null,
  });

  return (
    <AppSiteChrome mainClassName="min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-50">
      <ViewCountTracker mediaId={media.id} />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-900 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#f97316_0,_transparent_55%)]" />
            <img
              src={heroImage}
              alt={media.mediaName}
              className="h-full w-full object-cover mix-blend-overlay blur-sm"
            />
          </div>
          <div className={`relative ${landing.container} flex flex-col gap-6 py-10 lg:flex-row lg:items-end`}>
            {inquiryStatus === "ok" && (
              <div className="absolute left-4 right-4 top-2 z-10 mx-auto max-w-4xl rounded-full border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-center text-xs text-emerald-100 backdrop-blur-md">
                {isKo
                  ? t("inquiry_ok")
                  : t("inquiry_ok")}
              </div>
            )}
            {inquiryStatus === "error" && (
              <div className="absolute left-4 right-4 top-2 z-10 mx-auto max-w-4xl rounded-full border border-red-400/60 bg-red-500/10 px-4 py-2 text-center text-xs text-red-100 backdrop-blur-md">
                {t("inquiry_error")}
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Link href={`/${locale}/explore`} className="hover:text-orange-400">
                  {t("explore")}
                </Link>
                <span>/</span>
                <span className="uppercase tracking-wide text-orange-400">
                  {media.category}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {media.mediaName}
                </h1>
                <ShareButtons title={`${media.mediaName} - XtheX`} url={pageUrl} />
              </div>
              {media.description && (
                <p className="max-w-2xl text-sm text-zinc-300 whitespace-pre-wrap">
                  {media.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {media.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-200 ring-1 ring-zinc-700"
                  >
                    #{tag}
                  </span>
                ))}
                {media.trustScore != null && (
                  <span className="ml-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                    Trust {media.trustScore}/100
                  </span>
                )}
                {inquiryCount > 0 && (
                  <span className="ml-1 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium text-zinc-200 ring-1 ring-zinc-700">
                    {t("inquiry_count", { count: inquiryCount })}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full max-w-xs space-y-3 rounded-2xl bg-zinc-900/80 p-4 backdrop-blur-md ring-1 ring-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("summary")}
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-zinc-200">
                  {location.address ?? t("no_address")}
                  {location.district ? ` · ${location.district}` : ""}
                </p>
                <p className="text-zinc-400">
                  {displayPriceLabel}
                  {media.cpm != null
                    ? ` · CPM ${media.cpm.toLocaleString()}${isKo ? "원" : " KRW"}`
                    : ""}
                </p>
                {media.targetAudience && (
                  <p className="text-xs text-zinc-400">
                    {t("audience")}: {media.targetAudience}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <MediaCreativeHints
                  locale={locale}
                  mediaId={media.id}
                  mediaName={media.mediaName}
                  mediaCategory={media.category}
                  targetAudienceText={media.targetAudience}
                />
              </div>
              <Link
                href={`/${locale}/medias/${media.id}/contact`}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-orange-500 px-4 text-base font-semibold text-white shadow-sm hover:bg-orange-400"
              >
                {t("contact_this_media")}
              </Link>
              <SaveInterestButton
                mediaId={media.id}
                mediaName={media.mediaName}
                labels={{
                  save: isKo ? "관심 미디어로 저장" : "Save as Interested Media",
                  saved: isKo ? "관심 미디어에 저장됨" : "Saved to Interested Media",
                }}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <OmnichannelTrigger mediaId={media.id} locale={locale} />
                <AddToOmniCartButton
                  mediaId={media.id}
                  mediaName={media.mediaName}
                  category={media.category}
                  price={media.price}
                />
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href={`/${locale}/explore?center=${location.lat ?? 37.5665},${location.lng ?? 126.978}&zoom=15`}
                  className="flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
                >
                  {t("view_on_map")}
                </Link>
                <Link
                  href={`/${locale}/explore`}
                  className="flex w-full items-center justify-center rounded-full border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80"
                >
                  {t("browse_other_media")}
                </Link>
                <a
                  href={xShare}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-full border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80"
                >
                  {t("share_x")}
                </a>
                <a
                  href={linkedInShare}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-full border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80"
                >
                  {t("share_linkedin")}
                </a>
                <a
                  href={kakaoShare}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-full border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80"
                >
                  {t("share_kakao")}
                </a>
              </div>
            </div>
          </div>
      </section>

      {/* Body */}
      <section className={`${landing.container} py-10`}>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
              <p className="text-xs text-zinc-500">{t("price")}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-100">{displayPriceLabel}</p>
            </div>
            <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
              <p className="text-xs text-zinc-500">{t("location")}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-100">
                {location.address ?? t("no_address")}
                {location.district ? ` · ${location.district}` : ""}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
              <p className="text-xs text-zinc-500">{t("impressions_traffic")}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-100">
                {exposure.daily_traffic ?? t("no_performance_data")}
              </p>
            </div>
          </div>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
            {/* Left column – editorial blocks */}
            <div className="space-y-8">
              <article className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {t("location_audience")}
                </h2>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                    <p className="text-xs text-zinc-500">
                      {t("location")}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {location.address ?? t("no_address")}
                    </p>
                    {location.district && (
                      <p className="mt-0.5 text-xs text-zinc-500">{location.district}</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                    <p className="text-xs text-zinc-500">
                      {t("audience")}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {media.targetAudience ?? t("no_audience_info")}
                    </p>
                  </div>
                </div>
              </article>

              <article className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {t("performance")}
                </h2>
                <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                  <p className="text-xs text-zinc-500">
                    {t("impressions_traffic")}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                    {exposure.daily_traffic && (
                      <li>
                        {t("daily_traffic")}: {exposure.daily_traffic}
                      </li>
                    )}
                    {exposure.monthly_impressions && (
                      <li>
                        {t("monthly_impressions")}:{" "}
                        {exposure.monthly_impressions}
                      </li>
                    )}
                    {exposure.reach && (
                      <li>
                        {t("reach")}: {exposure.reach}
                      </li>
                    )}
                    {exposure.frequency && (
                      <li>
                        {t("frequency")}: {exposure.frequency}
                      </li>
                    )}
                    {!exposure.daily_traffic &&
                      !exposure.monthly_impressions &&
                      !exposure.reach &&
                      !exposure.frequency && (
                        <li>
                          {t("no_performance_data")}
                        </li>
                      )}
                  </ul>
                </div>
              </article>

              <article className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {t("editorial_notes")}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/30">
                    <p className="text-xs font-semibold text-emerald-300">
                      {t("strengths")}
                    </p>
                    <p className="mt-2 text-xs text-emerald-100">
                      {media.pros ??
                        t("no_strengths")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-500/5 p-4 ring-1 ring-amber-500/30">
                    <p className="text-xs font-semibold text-amber-300">
                      {t("cautions")}
                    </p>
                    <p className="mt-2 text-xs text-amber-100">
                      {media.cons ??
                        t("no_cautions")}
                    </p>
                  </div>
                </div>
              </article>

              <MediaCaseStudies caseStudies={[]} locale={locale} />

              {similarMedias.length > 0 && (
                <article className="space-y-4">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {t("similar_media")}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {similarMedias.map((m) => {
                      const loc = (m.locationJson ?? {}) as any;
                      return (
                        <Link
                          key={m.id}
                          href={`/${locale}/medias/${m.id}`}
                          className="group flex flex-col justify-between rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800 hover:bg-zinc-900 hover:ring-zinc-600"
                        >
                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              {m.category}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-100 group-hover:text-white">
                              {m.mediaName}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                              {m.description ?? ""}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                            <span className="truncate">
                              {loc.address ?? t("no_address")}
                            </span>
                            {m.price != null && (
                              <span className="ml-2 flex-shrink-0 font-medium text-zinc-200">
                                {m.price.toLocaleString()}
                                {isKo ? "원" : " KRW"}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </article>
              )}

              <SimilarBundleSection
                locale={locale}
                baseMediaIds={[media.id]}
                items={similarEffectMedias}
                titleKo="이 매체와 비슷한 효과 예상 매체"
                titleEn="Similar expected effect"
                subtitleKo="카테고리/상권/CPM을 기준으로 3개를 추천합니다."
                subtitleEn="Recommended by category, district, and CPM."
              />
            </div>

            {/* Right column – gallery (3~5장 슬라이드) + 집행 사례 */}
            <aside className="space-y-6">
              <MediaGallery
                images={imageUrls}
                mediaName={media.mediaName}
              />

              {videoUrls.length > 0 && (
                <div className="space-y-2 rounded-3xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Media Footage
                  </p>
                  <div className="space-y-3">
                    {videoUrls.map((url) =>
                      url.includes("youtube.com") || url.includes("youtu.be") ? (
                        <div
                          key={url}
                          className="aspect-video w-full overflow-hidden rounded-xl ring-1 ring-zinc-800"
                        >
                          <iframe
                            src={url}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video
                          key={url}
                          src={url}
                          controls
                          className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-zinc-800"
                        />
                      ),
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
      </section>
    </AppSiteChrome>
  );
}

