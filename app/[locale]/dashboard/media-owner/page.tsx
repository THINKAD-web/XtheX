import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  MediaOwnerMapPreview,
  type MediaOwnerMapMarker,
} from "@/components/dashboard/media-owner-map-preview";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { DashboardStatsSection } from "@/components/dashboard/DashboardStatsSection";
import { MediaOwnerQuickActions } from "@/components/dashboard/MediaOwnerQuickActions";
import { prisma } from "@/lib/prisma";
import { DashboardNotificationBanner } from "@/components/layout/DashboardNotificationBanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Media Owner Dashboard | XtheX",
  description: "Manage media listings, inquiries, and performance as a media owner.",
  robots: { index: false, follow: false },
};

export default async function MediaOwnerDashboardPage() {
  const user = await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.mediaOwner");
  const tm = await getTranslations("dashboard.mobile");
  const mediasForMap = await prisma.media.findMany({
    where: {
      createdById: user.id,
      locationJson: { path: ["lat"], gte: -90, lte: 90 },
      AND: [{ locationJson: { path: ["lng"], gte: -180, lte: 180 } }],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      mediaName: true,
      locationJson: true,
      viewCount: true,
      status: true,
      price: true,
      updatedAt: true,
    },
  });

  const mapMarkers: MediaOwnerMapMarker[] = mediasForMap.flatMap((media) => {
    const location =
      media.locationJson && typeof media.locationJson === "object"
        ? (media.locationJson as Record<string, unknown>)
        : null;

    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [];
    }

    return [
      {
        code: media.id,
        label: media.mediaName,
        position: { lat, lng },
        intensity: Math.min(5, Math.max(1, Math.ceil(media.viewCount / 100))),
        status: media.status,
        price: media.price,
        viewCount: media.viewCount,
        updatedAt: media.updatedAt.toLocaleDateString("ko-KR"),
        href: `/dashboard/media-owner/medias/${media.id}/edit`,
      },
    ];
  });

  const displayName =
    user.name?.trim() ||
    (user.email?.includes("@") ? user.email.split("@")[0] : user.email) ||
    t("default_name");

  return (
    <main className={`${landing.container} space-y-10 py-10 lg:space-y-12 lg:py-14`}>
        <DashboardNotificationBanner message="새로운 문의가 있는지 확인하세요" />
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/50 p-8 shadow-lg dark:border-zinc-700 dark:from-zinc-900 dark:via-emerald-950/25 dark:to-zinc-900/90 dark:shadow-black/30 lg:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-0 h-44 w-44 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10"
            aria-hidden
          />
          <h1 className="relative text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
            {t("hero", { name: displayName })}
          </h1>
          <p className="relative mt-3 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </section>

        <DashboardStatsSection role="MEDIA_OWNER" />

        <section aria-labelledby="media-owner-quick-actions">
          <h2 id="media-owner-quick-actions" className="sr-only">
            Quick actions
          </h2>
          <MediaOwnerQuickActions
            cardClass={landing.card}
            swipeHint={tm("swipe_kpis_hint")}
            carouselAriaLabel={tm("carousel_quick_actions")}
            registerLabel={t("quick_register")}
            mediasLabel={t("quick_medias")}
            inquiriesLabel={t("quick_inquiries_contracts")}
          />
        </section>

        <section
          className={`${landing.surface} border-emerald-100/80 dark:border-zinc-700`}
          aria-labelledby="map-preview"
        >
          <h2
            id="map-preview"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {t("map_title")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("map_caption")}
          </p>
          <div className="mt-4">
            <MediaOwnerMapPreview markers={mapMarkers} />
          </div>
        </section>
      </main>
  );
}
