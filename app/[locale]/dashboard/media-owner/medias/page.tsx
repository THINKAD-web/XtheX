import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaOwnerMediasPage() {
  const user = await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.mediaOwner");

  const medias = await prisma.media.findMany({
    where: { createdById: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      mediaName: true,
      category: true,
      status: true,
      viewCount: true,
      updatedAt: true,
    },
  });

  return (
    <DashboardChrome>
      <div className={`${landing.container} space-y-8 py-10 lg:py-14`}>
        <div>
          <Link
            href="/dashboard/media-owner"
            className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            ← {t("back_dashboard")}
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("medias_title")}
          </h1>
          <p className="mt-2 max-w-xl text-pretty text-zinc-600 dark:text-zinc-400">
            {t("medias_subtitle")}
          </p>
        </div>

        {medias.length === 0 ? (
          <div
            className={`${landing.card} border-dashed border-emerald-300/50 py-16 text-center dark:border-emerald-900/40`}
          >
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              {t("medias_empty")}
            </p>
            <Link href="/upload" className={`${landing.btnPrimary} mt-6 inline-flex`}>
              {t("medias_upload_cta")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {medias.map((m) => (
              <li
                key={m.id}
                className={`${landing.surface} flex flex-col gap-2 border-zinc-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {m.mediaName}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {m.category} ·{" "}
                    {t("medias_views", { count: m.viewCount })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit shrink-0 border-sky-300/60 text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
                >
                  {m.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardChrome>
  );
}
