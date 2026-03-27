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
import { MediaDetailStickyBar } from "@/components/medias/MediaDetailStickyBar";
import { AdminMediaEditPanel } from "@/components/medias/AdminMediaEditPanel";
import { AdminCaseStudyModal } from "@/components/medias/AdminCaseStudyModal";
import { getCurrentUser } from "@/lib/auth/rbac";
import {
  convertCurrency,
  formatCurrency,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency";
import {
  Users,
  Eye,
  Target,
  Repeat,
  Coins,
  BarChart3,
  MapPin,
  Banknote,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Navigation,
} from "lucide-react";

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|mov|m4v)$/i.test(url) || url.includes("youtube.com") || url.includes("youtu.be");

function formatTraffic(n: unknown, isKo: boolean): string {
  if (n == null) return "-";
  const num = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(num)) return String(n);
  if (!isKo) return num >= 1_000_000 ? `${(num / 1_000_000).toFixed(1)}M` : num.toLocaleString("en-US");
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
  if (num >= 10_000) return `${Math.round(num / 10_000)}만`;
  return num.toLocaleString("ko-KR");
}

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
      audienceTags: true,
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

  const [similarMedias, inquiryCount, caseStudies, currentUser] = await Promise.all([
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
    prisma.caseStudy.findMany({
      where: { mediaId: media.id },
      orderBy: { createdAt: "desc" },
    }),
    getCurrentUser().catch(() => null),
  ]);

  const isAdmin = currentUser?.role === "ADMIN";

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

      {/* ── Stats Grid ── */}
      <section className={`${landing.container} py-10`}>
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t("stats_overview")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {([
            { icon: Users,    label: t("daily_traffic"),       value: exposure.daily_traffic != null ? formatTraffic(exposure.daily_traffic, isKo) : null },
            { icon: Eye,      label: t("monthly_impressions"), value: exposure.monthly_impressions != null ? formatTraffic(exposure.monthly_impressions, isKo) : null },
            { icon: Target,   label: t("reach"),               value: exposure.reach != null ? `${exposure.reach}%` : null },
            { icon: Repeat,   label: t("frequency"),           value: exposure.frequency != null ? `${exposure.frequency}${isKo ? "회" : "x"}` : null },
            { icon: Coins,    label: "CPM",                    value: (exposure.cpm ?? media.cpm) != null ? `${Number(exposure.cpm ?? media.cpm).toLocaleString()}${isKo ? "원" : " KRW"}` : null },
            { icon: BarChart3, label: t("visibility_score"),   value: exposure.visibility_score != null ? `${exposure.visibility_score}/100` : null },
          ] as const).map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-100">
                  {value ?? t("no_performance_data")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Body: Two-column layout ── */}
      <section className={`${landing.container} pb-10`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Target Audience */}
            <article className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {t("target_audience_section")}
              </h2>
              <div className="rounded-2xl bg-zinc-900/80 p-5 ring-1 ring-zinc-800">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <UserCheck className="h-3.5 w-3.5" />
                      {t("target_age")}
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-100">
                      {exposure.target_age ?? "-"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <Users className="h-3.5 w-3.5" />
                      {t("target_description")}
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-100">
                      {media.targetAudience ?? t("no_audience_info")}
                    </p>
                  </div>
                </div>
                {media.audienceTags && media.audienceTags.length > 0 && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <p className="mb-2 text-[11px] text-zinc-500">{t("target_tags")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {media.audienceTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-300 ring-1 ring-orange-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Location */}
            <article className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {t("location_section")}
              </h2>
              <div className="rounded-2xl bg-zinc-900/80 p-5 ring-1 ring-zinc-800">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {t("address_label")}
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-100">
                      {location.address ?? t("no_address")}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <Navigation className="h-3.5 w-3.5" />
                      {t("district_label")}
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-100">
                      {location.district ?? "-"}
                    </p>
                  </div>
                </div>
                {(location.lat != null && location.lng != null) && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <p className="mb-2 text-[11px] text-zinc-500">{t("coordinates")}</p>
                    <div className="flex items-center gap-4">
                      <code className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                        {Number(location.lat).toFixed(5)}, {Number(location.lng).toFixed(5)}
                      </code>
                      <Link
                        href={`/${locale}/explore?center=${location.lat},${location.lng}&zoom=15`}
                        className="text-xs text-orange-400 hover:underline"
                      >
                        {t("view_on_map")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Pricing */}
            <article className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {t("pricing_section")}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">{t("monthly_ad_price")}</p>
                    <p className="mt-0.5 text-sm font-semibold text-zinc-100">{displayPriceLabel}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">CPM</p>
                    <p className="mt-0.5 text-sm font-semibold text-zinc-100">
                      {media.cpm != null
                        ? `${media.cpm.toLocaleString()}${isKo ? "원" : " KRW"}`
                        : t("price_on_request")}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Pros & Cons */}
            {(media.pros || media.cons) && (
              <article className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {t("pros_cons_section")}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-300">{t("strengths")}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-emerald-100">
                      {media.pros ?? t("no_strengths")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-500/5 p-4 ring-1 ring-amber-500/30">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-3.5 w-3.5 text-amber-400" />
                      <p className="text-xs font-semibold text-amber-300">{t("cautions")}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-amber-100">
                      {media.cons ?? t("no_cautions")}
                    </p>
                  </div>
                </div>
              </article>
            )}

            <MediaCaseStudies
              caseStudies={caseStudies.map((cs) => ({
                titleKo: cs.title,
                titleEn: cs.title,
                descriptionKo: [cs.client ? `클라이언트: ${cs.client}` : "", cs.description ?? ""].filter(Boolean).join(" · "),
                descriptionEn: [cs.client ? `Client: ${cs.client}` : "", cs.description ?? ""].filter(Boolean).join(" · "),
                result: cs.result ?? undefined,
                imageUrl: cs.images[0] ?? undefined,
              }))}
              locale={locale}
              adminButton={isAdmin ? <AdminCaseStudyModal mediaId={media.id} /> : undefined}
            />

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

          {/* Right column – gallery + footage */}
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
      <MediaDetailStickyBar mediaId={media.id} mediaName={media.mediaName} />
      {isAdmin && (
        <AdminMediaEditPanel
          media={{
            id: media.id,
            mediaName: media.mediaName,
            description: media.description,
            price: media.price,
            cpm: media.cpm,
            exposureJson: (media.exposureJson ?? {}) as any,
            locationJson: (media.locationJson ?? {}) as any,
            targetAudience: media.targetAudience,
            audienceTags: media.audienceTags ?? [],
            tags: media.tags ?? [],
            pros: media.pros,
            cons: media.cons,
          }}
        />
      )}
    </AppSiteChrome>
  );
}

