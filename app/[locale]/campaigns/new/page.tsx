import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { CampaignNewDraftForm } from "@/components/campaign/CampaignNewDraftForm";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim(),
  );
}

function parseLocationMeta(locationJson: unknown): { city: string; locationText: string } {
  if (!locationJson || typeof locationJson !== "object" || Array.isArray(locationJson)) {
    return { city: "-", locationText: "-" };
  }
  const data = locationJson as Record<string, unknown>;
  const district = typeof data.district === "string" ? data.district.trim() : "";
  const city = typeof data.city === "string" ? data.city.trim() : "";
  const address = typeof data.address === "string" ? data.address.trim() : "";
  const cityLabel = district || city || address.split(" ").slice(0, 2).join(" ") || "-";
  const locationText = [district, city, address].filter(Boolean).join(" ").trim() || cityLabel;
  return { city: cityLabel, locationText };
}

export default async function NewCampaignPlaceholderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await gateAdvertiserDashboard();
  const { locale } = await params;
  const t = await getTranslations("dashboard.advertiser");
  const sp = (await searchParams) ?? {};

  const rawMediaIds = Array.isArray(sp.mediaIds)
    ? sp.mediaIds.join(",")
    : typeof sp.mediaIds === "string"
      ? sp.mediaIds
      : "";
  const fromList = rawMediaIds
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const fromSingle = typeof sp.mediaId === "string" ? [sp.mediaId.trim()] : [];
  const selectedIds = [...new Set([...fromList, ...fromSingle].filter((v) => isUuid(v)))];

  const selectedMedias =
    selectedIds.length > 0
      ? await prisma.media.findMany({
          where: {
            id: { in: selectedIds },
            status: "PUBLISHED",
          },
          select: {
            id: true,
            mediaName: true,
            category: true,
            locationJson: true,
            globalCountryCode: true,
          },
          take: 24,
        })
      : [];

  const availableMedias = await prisma.media.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      mediaName: true,
      category: true,
      locationJson: true,
      globalCountryCode: true,
      price: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  return (
    <DashboardChrome>
      <div className={`${landing.container} max-w-2xl space-y-8 py-12 lg:py-16`}>
        <div className={`${landing.surface} border-sky-200/60 p-6 dark:border-zinc-700`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
            {t("recommendationsV2.selected_from_recommendations")}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t("recommendationsV2.selected_count", { count: selectedMedias.length })}
          </h2>
          <div className="mt-5">
            <CampaignNewDraftForm
              locale={locale}
              initialMediaIds={selectedMedias.map((m) => m.id)}
              availableMedias={availableMedias.map((m) => {
                const location = parseLocationMeta(m.locationJson);
                return {
                  id: m.id,
                  mediaName: m.mediaName,
                  category: String(m.category),
                  city: location.city,
                  locationText: location.locationText,
                  countryCode: m.globalCountryCode ?? "KR",
                  priceMonthlyKrw: m.price ?? null,
                };
              })}
            />
          </div>
        </div>

        <div
          className={`${landing.surface} border-sky-200/60 p-8 dark:border-zinc-700`}
        >
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("placeholders.new_title")}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("placeholders.new_body")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/explore" className={landing.btnPrimary}>
              {t("placeholders.cta_explore")}
            </Link>
            <Link href="/dashboard/advertiser" className={landing.btnSecondary}>
              {t("placeholders.back_dashboard")}
            </Link>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
