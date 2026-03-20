import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Show } from "@/components/auth/show";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { OmnichannelTrigger } from "@/components/campaign/OmnichannelTrigger";
import { MediaGallery } from "@/components/medias/MediaGallery";
import { MediaCaseStudies } from "@/components/medias/MediaCaseStudies";
import { ViewCountTracker } from "@/components/medias/ViewCountTracker";
import { MediaCreativeHints } from "@/components/hints/MediaCreativeHints";
import { getSimilarMediasForMedia } from "@/lib/medias/similar";
import { SimilarBundleSection } from "@/components/medias/SimilarBundleSection";

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

async function Navbar() {
  const t = await getTranslations("nav");
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          XtheX
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                {t("sign_in")}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">{t("sign_up")}</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}

export default async function MediaDetailPage({ params, searchParams }: PageProps) {
  const { locale, mediaId } = await params;
  const sp = (await searchParams) ?? {};
  const isKo = locale === "ko";

  if (!isMediaUuid(mediaId)) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-zinc-100">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-zinc-500">공개된 매체를 찾을 수 없습니다.</p>
          <Link
            href={`/${locale}/explore`}
            className="mt-4 inline-flex text-sm text-orange-400 hover:underline"
          >
            ← 탐색 페이지로 돌아가기
          </Link>
        </div>
      </div>
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
      <div className="min-h-screen bg-black px-4 py-12 text-zinc-100">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-zinc-500">공개된 매체를 찾을 수 없습니다.</p>
          <Link
            href={`/${locale}/explore`}
            className="mt-4 inline-flex text-sm text-orange-400 hover:underline"
          >
            ← 탐색 페이지로 돌아가기
          </Link>
        </div>
      </div>
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

  const similarEffectMedias = await getSimilarMediasForMedia({
    id: media.id,
    mediaName: media.mediaName,
    category: media.category,
    locationJson: media.locationJson,
    cpm: media.cpm ?? null,
  });

  return (
    <>
      <Navbar />
      <ViewCountTracker mediaId={media.id} />
      <div className="min-h-screen bg-zinc-950 pt-20 text-zinc-50">
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
          <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 lg:flex-row lg:items-end">
            {inquiryStatus === "ok" && (
              <div className="absolute left-4 right-4 top-2 z-10 mx-auto max-w-4xl rounded-full border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-center text-xs text-emerald-100 backdrop-blur-md">
                {isKo
                  ? "문의가 접수되었습니다. 관리자 화면에서 테스트용 문의를 확인할 수 있습니다."
                  : "Your inquiry has been recorded. It is stored for testing in the admin console."}
              </div>
            )}
            {inquiryStatus === "error" && (
              <div className="absolute left-4 right-4 top-2 z-10 mx-auto max-w-4xl rounded-full border border-red-400/60 bg-red-500/10 px-4 py-2 text-center text-xs text-red-100 backdrop-blur-md">
                {isKo
                  ? "문의 전송 중 오류가 발생했습니다. 필수 항목을 다시 확인해 주세요."
                  : "There was an error sending your inquiry. Please check required fields and try again."}
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Link href={`/${locale}/explore`} className="hover:text-orange-400">
                  {isKo ? "탐색" : "Explore"}
                </Link>
                <span>/</span>
                <span className="uppercase tracking-wide text-orange-400">
                  {media.category}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {media.mediaName}
              </h1>
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
                    {isKo
                      ? `문의 ${inquiryCount}건`
                      : inquiryCount === 1
                        ? "1 inquiry"
                        : `${inquiryCount} inquiries`}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full max-w-xs space-y-3 rounded-2xl bg-zinc-900/80 p-4 backdrop-blur-md ring-1 ring-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {isKo ? "Summary" : "Summary"}
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-zinc-200">
                  {location.address ?? (isKo ? "주소 정보 없음" : "No address")}
                  {location.district ? ` · ${location.district}` : ""}
                </p>
                <p className="text-zinc-400">
                  {media.price != null
                    ? `${media.price.toLocaleString()}${isKo ? "원" : " KRW"}`
                    : isKo
                      ? "가격 협의"
                      : "Price on request"}
                  {media.cpm != null
                    ? ` · CPM ${media.cpm.toLocaleString()}${isKo ? "원" : " KRW"}`
                    : ""}
                </p>
                {media.targetAudience && (
                  <p className="text-xs text-zinc-400">
                    {isKo ? "타깃" : "Audience"}: {media.targetAudience}
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
                className="mt-2 flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-400"
              >
                {isKo ? "이 매체로 문의하기" : "Contact about this media"}
              </Link>
              <div className="mt-2">
                <OmnichannelTrigger mediaId={media.id} locale={locale} />
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href={`/${locale}/explore?center=${location.lat ?? 37.5665},${location.lng ?? 126.978}&zoom=15`}
                  className="flex w-full items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
                >
                  {isKo ? "매체 지도에서 보기" : "View on map"}
                </Link>
                <Link
                  href={`/${locale}/explore`}
                  className="flex w-full items-center justify-center rounded-full border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80"
                >
                  {isKo ? "다른 매체 둘러보기" : "Browse other media"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
            {/* Left column – editorial blocks */}
            <div className="space-y-8">
              <article className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isKo ? "Location & Audience" : "Location & Audience"}
                </h2>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                    <p className="text-xs text-zinc-500">
                      {isKo ? "위치" : "Location"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {location.address ?? (isKo ? "주소 정보 없음" : "No address")}
                    </p>
                    {location.district && (
                      <p className="mt-0.5 text-xs text-zinc-500">{location.district}</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                    <p className="text-xs text-zinc-500">
                      {isKo ? "타깃" : "Audience"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {media.targetAudience ?? (isKo ? "타깃 정보 없음" : "No audience info")}
                    </p>
                  </div>
                </div>
              </article>

              <article className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isKo ? "Performance" : "Performance"}
                </h2>
                <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                  <p className="text-xs text-zinc-500">
                    {isKo ? "노출 · 트래픽" : "Impressions & traffic"}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                    {exposure.daily_traffic && (
                      <li>
                        {isKo ? "일일 유동인구" : "Daily traffic"}: {exposure.daily_traffic}
                      </li>
                    )}
                    {exposure.monthly_impressions && (
                      <li>
                        {isKo ? "월 노출 수" : "Monthly impressions"}:{" "}
                        {exposure.monthly_impressions}
                      </li>
                    )}
                    {exposure.reach && (
                      <li>
                        {isKo ? "도달률" : "Reach"}: {exposure.reach}
                      </li>
                    )}
                    {exposure.frequency && (
                      <li>
                        {isKo ? "빈도" : "Frequency"}: {exposure.frequency}
                      </li>
                    )}
                    {!exposure.daily_traffic &&
                      !exposure.monthly_impressions &&
                      !exposure.reach &&
                      !exposure.frequency && (
                        <li>
                          {isKo ? "노출 데이터가 없습니다." : "No performance data available."}
                        </li>
                      )}
                  </ul>
                </div>
              </article>

              <article className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isKo ? "Editorial Notes" : "Editorial Notes"}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/30">
                    <p className="text-xs font-semibold text-emerald-300">
                      {isKo ? "장점" : "Strengths"}
                    </p>
                    <p className="mt-2 text-xs text-emerald-100">
                      {media.pros ??
                        (isKo ? "등록된 장점이 없습니다." : "No strengths registered.")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-500/5 p-4 ring-1 ring-amber-500/30">
                    <p className="text-xs font-semibold text-amber-300">
                      {isKo ? "유의사항" : "Cautions"}
                    </p>
                    <p className="mt-2 text-xs text-amber-100">
                      {media.cons ??
                        (isKo ? "등록된 유의사항이 없습니다." : "No cautions registered.")}
                    </p>
                  </div>
                </div>
              </article>

              <MediaCaseStudies caseStudies={[]} locale={locale} />

              {similarMedias.length > 0 && (
                <article className="space-y-4">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {isKo ? "비슷한 매체" : "Similar media"}
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
                              {loc.address ?? (isKo ? "주소 정보 없음" : "No address")}
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
      </div>
    </>
  );
}

