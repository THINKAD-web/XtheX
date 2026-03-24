import Link from "next/link";
import { getAuthSession } from "@/lib/auth/session";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  computePerformanceSummary,
  type PerformanceSummary,
} from "@/lib/campaign/performance";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.performance");
  return { title: t("title"), description: t("subtitle") };
}

type DraftWithStats = {
  id: string;
  name: string | null;
  channelDooh: boolean;
  channelWeb: boolean;
  channelMobile: boolean;
  mediaIds: string[];
  createdAt: Date;
  summary: PerformanceSummary;
  mediaNames: string[];
};

async function getDraftsWithStats(userId: string): Promise<DraftWithStats[]> {
  const campaignDraft = (prisma as any).campaignDraft;
  if (!campaignDraft?.findMany) return [];

  const drafts = await campaignDraft.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const result: DraftWithStats[] = [];
  for (const d of drafts) {
    const ids = Array.isArray(d.mediaIds) ? d.mediaIds : [];
    if (ids.length === 0) {
      result.push({
        id: d.id,
        name: d.name ?? null,
        channelDooh: d.channelDooh ?? true,
        channelWeb: d.channelWeb ?? false,
        channelMobile: d.channelMobile ?? false,
        mediaIds: [],
        createdAt: d.createdAt,
        summary: { mediaCount: 0, minPrice: null, maxPrice: null, avgCpm: null, totalMonthlyImpressions: null },
        mediaNames: [],
      });
      continue;
    }

    const medias = await prisma.media.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        mediaName: true,
        price: true,
        cpm: true,
        exposureJson: true,
      },
    });

    const summary = computePerformanceSummary(
      medias.map((m) => ({
        id: m.id,
        price: m.price,
        cpm: m.cpm,
        exposureJson: m.exposureJson,
      })),
    );

    result.push({
      id: d.id,
      name: d.name ?? null,
      channelDooh: d.channelDooh ?? true,
      channelWeb: d.channelWeb ?? false,
      channelMobile: d.channelMobile ?? false,
      mediaIds: ids,
      createdAt: d.createdAt,
      summary,
      mediaNames: medias.map((m) => m.mediaName),
    });
  }
  return result;
}

type PageProps = { params: Promise<{ locale: string }> };

export default async function PerformanceDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.performance");
  const session = await getAuthSession();

  let draftsWithStats: DraftWithStats[] = [];
  let isSignedIn = false;

  if (session?.user?.id) {
    isSignedIn = true;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (user) {
      try {
        draftsWithStats = await getDraftsWithStats(user.id);
      } catch {
        draftsWithStats = [];
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="text-lg font-bold tracking-tight text-zinc-50">
            XtheX
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/explore`}
              className="text-sm font-medium text-zinc-400 hover:text-zinc-200"
            >
              {t("nav_explore")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-20">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {t("subtitle")}
            </p>
          </div>

          {!isSignedIn && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-300">{t("sign_in_prompt")}</p>
              <Link
                href={`/${locale}/sign-in`}
                className="mt-3 inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                {t("sign_in_cta")}
              </Link>
            </div>
          )}

          {isSignedIn && draftsWithStats.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-sm text-zinc-400">{t("no_drafts")}</p>
              <Link
                href={`/${locale}/explore`}
                className="mt-4 inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                {t("cta_explore")}
              </Link>
            </div>
          )}

          {isSignedIn && draftsWithStats.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                {t("your_campaigns")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {draftsWithStats.map((draft) => (
                  <Link
                    key={draft.id}
                    href={`/${locale}/campaigns/${draft.id}`}
                    className="block rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 ring-1 ring-zinc-800 transition-colors hover:bg-zinc-900 hover:ring-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-zinc-100">
                        {draft.name || t("unnamed_draft")}
                      </h3>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {draft.mediaIds.length} {t("media_count")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-zinc-500">
                      {draft.channelDooh && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5">DOOH</span>
                      )}
                      {draft.channelWeb && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5">Web</span>
                      )}
                      {draft.channelMobile && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5">Mobile</span>
                      )}
                    </div>

                    <dl className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm">
                      {(draft.summary.minPrice != null || draft.summary.maxPrice != null) && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-zinc-500">{t("stat_price_range")}</dt>
                          <dd className="font-medium text-zinc-200">
                            {draft.summary.minPrice != null && draft.summary.maxPrice != null
                              ? `${(draft.summary.minPrice / 10000).toFixed(0)}만 ~ ${(draft.summary.maxPrice / 10000).toFixed(0)}만 ${t("won")}`
                              : draft.summary.minPrice != null
                                ? `≥ ${(draft.summary.minPrice / 10000).toFixed(0)}만 ${t("won")}`
                                : `≤ ${(draft.summary.maxPrice! / 10000).toFixed(0)}만 ${t("won")}`}
                          </dd>
                        </div>
                      )}
                      {draft.summary.avgCpm != null && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-zinc-500">{t("stat_avg_cpm")}</dt>
                          <dd className="font-medium text-zinc-200">
                            {draft.summary.avgCpm.toLocaleString()} {t("won")}
                          </dd>
                        </div>
                      )}
                      {draft.summary.totalMonthlyImpressions != null && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-zinc-500">{t("stat_monthly_impressions")}</dt>
                          <dd className="font-medium text-zinc-200">
                            {draft.summary.totalMonthlyImpressions >= 10000
                              ? `${(draft.summary.totalMonthlyImpressions / 10000).toFixed(1)}만`
                              : draft.summary.totalMonthlyImpressions.toLocaleString()}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {draft.mediaNames.length > 0 && (
                      <p className="mt-3 line-clamp-2 text-xs text-zinc-500">
                        {draft.mediaNames.slice(0, 3).join(" · ")}
                        {draft.mediaNames.length > 3 && " …"}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
