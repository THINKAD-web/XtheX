import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { appMainContainerClass } from "@/lib/layout/app-chrome";
import { MediaHeroSlider } from "@/components/medias/MediaHeroSlider";
import { AIInsightCard } from "@/components/medias/AIInsightCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  convertCurrency,
  formatCurrency,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) {
    return {
      title: "Media Detail | XtheX",
      description: "Public media detail page.",
    };
  }
  const media = await prisma.media.findUnique({
    where: { id },
    select: { mediaName: true, description: true, status: true },
  });
  if (!media || media.status !== "PUBLISHED") {
    return {
      title: "Media Detail | XtheX",
      description: "Public media detail page.",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${media.mediaName} | XtheX`,
    description: media.description?.slice(0, 140) || "Public media detail page.",
  };
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim(),
  );
}

function flagFromCountryCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "🏳️";
  const base = 127397;
  return String.fromCodePoint(
    normalized.charCodeAt(0) + base,
    normalized.charCodeAt(1) + base,
  );
}

function getLocationLabel(
  locationJson: unknown,
  countryCode: string,
): { city: string; countryCode: string } {
  if (!locationJson || typeof locationJson !== "object" || Array.isArray(locationJson)) {
    return { city: "-", countryCode };
  }
  const location = locationJson as Record<string, unknown>;
  const district = typeof location.district === "string" ? location.district.trim() : "";
  const city = typeof location.city === "string" ? location.city.trim() : "";
  const address = typeof location.address === "string" ? location.address.trim() : "";
  return {
    city: district || city || address.split(" ").slice(0, 2).join(" ") || "-",
    countryCode,
  };
}

function readExposure(exposureJson: unknown): { size: string; resolution: string; traffic: string } {
  if (!exposureJson || typeof exposureJson !== "object" || Array.isArray(exposureJson)) {
    return { size: "-", resolution: "-", traffic: "-" };
  }
  const exposure = exposureJson as Record<string, unknown>;
  return {
    size: typeof exposure.screen_size === "string" ? exposure.screen_size : "-",
    resolution: typeof exposure.resolution === "string" ? exposure.resolution : "-",
    traffic:
      typeof exposure.daily_traffic === "number"
        ? exposure.daily_traffic.toLocaleString()
        : "-",
  };
}

export default async function PublicMediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const locale = await getLocale();
  const isKo = locale.startsWith("ko");
  const cookieStore = await cookies();
  const cookieCurrency = cookieStore.get("xthex_currency")?.value ?? "";
  const displayCurrency: SupportedCurrency = isSupportedCurrency(cookieCurrency)
    ? cookieCurrency
    : isKo
      ? "KRW"
      : "USD";

  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!media || media.status !== "PUBLISHED") notFound();

  const countryCode = media.globalCountryCode ?? "KR";
  const location = getLocationLabel(media.locationJson, countryCode);
  const exposure = readExposure(media.exposureJson);

  const images = [...(media.sampleImages ?? []), ...(media.images ?? [])]
    .filter((url) => /^https?:\/\//i.test(String(url)))
    .slice(0, 10);

  const convertedPrice =
    media.price != null
      ? convertCurrency(media.price, media.currency, displayCurrency)
      : null;
  const priceText =
    convertedPrice != null
      ? formatCurrency(convertedPrice, displayCurrency, isKo ? "ko-KR" : "en-US")
      : isKo
        ? "가격 협의"
        : "Price on request";

  const aiPoints =
    media.aiReviewComment?.trim()
      ? [media.aiReviewComment.trim()]
      : isKo
        ? ["AI 추천 이유 준비중", "도달률/가시성 기반 분석 예정", "타겟 적합도 분석 예정"]
        : [
            "AI recommendation reason is being prepared",
            "Reach and visibility analysis coming soon",
            "Audience-fit analysis coming soon",
          ];

  return (
    <AppSiteChrome mainClassName="min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-50">
      <main className={`${appMainContainerClass} space-y-6 py-8 lg:py-10`}>
        <div className="flex items-center justify-between gap-3">
          <Link href={`/${locale}/explore`} className="text-sm text-blue-600 hover:underline dark:text-sky-400">
            {isKo ? "← 탐색으로 돌아가기" : "← Back to explore"}
          </Link>
          <Badge variant="outline">
            {flagFromCountryCode(location.countryCode)} {location.countryCode}
          </Badge>
        </div>

        <MediaHeroSlider images={images} alt={media.mediaName} autoPlay />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <Card className="border-zinc-200/80 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  {media.mediaName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {media.description || (isKo ? "설명이 아직 등록되지 않았습니다." : "Description will be added soon.")}
                </p>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{isKo ? "위치" : "Location"}</p>
                    <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {flagFromCountryCode(location.countryCode)} {location.countryCode} · {location.city}
                    </p>
                  </div>
                  <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{isKo ? "가격" : "Price"}</p>
                    <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{priceText}</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="w-32 bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">{isKo ? "크기" : "Size"}</th>
                        <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{exposure.size}</td>
                      </tr>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">{isKo ? "해상도" : "Resolution"}</th>
                        <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{exposure.resolution}</td>
                      </tr>
                      <tr>
                        <th className="bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">{isKo ? "유동인구(일)" : "Daily traffic"}</th>
                        <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{exposure.traffic}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <AIInsightCard title={isKo ? "AI 추천 인사이트" : "AI Recommendation Insights"} points={aiPoints.slice(0, 3)} />
          </div>

          <aside className="space-y-4">
            <Card className="border-blue-200/70 dark:border-blue-400/20">
              <CardHeader>
                <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">
                  {isKo ? "캠페인 시작" : "Start campaign"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {isKo
                    ? "이 미디어를 포함한 캠페인 초안을 바로 만들 수 있습니다."
                    : "Create a campaign draft with this media immediately."}
                </p>
                <Link href={`/campaigns/new?mediaIds=${media.id}`} className="block">
                  <Button className="h-12 w-full bg-blue-600 text-base font-semibold hover:bg-blue-500">
                    {isKo ? "이 미디어로 캠페인 만들기" : "Create campaign with this media"}
                  </Button>
                </Link>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isKo
                    ? `등록자: ${media.createdBy?.name || media.createdBy?.email || "-"}`
                    : `Owner: ${media.createdBy?.name || media.createdBy?.email || "-"}`}
                </p>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </AppSiteChrome>
  );
}

