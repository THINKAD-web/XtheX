import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";
import { getTranslations } from "next-intl/server";
import { createDemoMedias } from "./actions";
import { AdminMediasClient } from "@/components/admin/AdminMediasClient";
import { AdminMediasDaypartShell } from "@/components/admin/AdminMediasDaypartShell";
import { AdminMediasToolbar } from "@/components/admin/AdminMediasToolbar";
import { AdminMediasTrendingDaypart } from "@/components/admin/AdminMediasTrendingDaypart";
import { TrendingMediasSection } from "@/components/medias/TrendingMediasSection";
import { DoohCampaignOnboardingModal } from "@/components/onboarding/DoohCampaignOnboardingModal";

export default async function AdminMediasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations("admin");
  const tm = await getTranslations("admin.medias");
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-700">{t("common.signIn")}</p>
        </div>
      </div>
    );
  }

  const dbUser = await findUserByClerkId(userId);
  if (!dbUser) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-700">{t("common.userNotFound")}</p>
        </div>
      </div>
    );
  }

  const { locale } = await params;
  const medias = await prisma.media.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      mediaName: true,
      description: true,
      category: true,
      status: true,
      price: true,
      cpm: true,
      updatedAt: true,
      createdBy: { select: { email: true, name: true } },
    },
  });

  return (
    <AdminMediasDaypartShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <DoohCampaignOnboardingModal locale={locale} />

        <AdminMediasToolbar
          locale={locale}
          createDemoMediasAction={createDemoMedias}
          labels={{
            back: tm("back"),
            aiUpload: tm("aiUpload"),
            demoMedias: tm("demoMedias"),
          }}
        />

        <AdminMediasTrendingDaypart>
          <TrendingMediasSection locale={locale} />
        </AdminMediasTrendingDaypart>

        <AdminMediasClient
          locale={locale}
          initialMedias={medias.map((m) => ({
            id: m.id,
            mediaName: m.mediaName,
            description: m.description ?? undefined,
            category: m.category,
            status: m.status,
            price: m.price ?? null,
            cpm: m.cpm ?? null,
            updatedAt: m.updatedAt.toISOString(),
            createdBy: m.createdBy,
          }))}
        />
      </div>
    </AdminMediasDaypartShell>
  );
}
