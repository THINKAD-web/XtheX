import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { PartnerDashboardClient } from "@/components/partner/dashboard-client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const runtime = "nodejs";

export default async function PartnerDashboardPage() {
  const t = await getTranslations("dashboard.partner");
  try {
    const { userId } = await auth();
    if (!userId) {
      return (
        <div className="min-h-screen bg-zinc-50 p-6">
          <div className="mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-700">{t("sign_in")}</p>
          </div>
        </div>
      );
    }

    let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    // 개발 단계: 로그인한 유저를 자동으로 PARTNER로 upsert 해서 막힘 없게 한다.
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          role: Role.PARTNER,
          email: "", // Clerk 이메일 동기화는 추후 정교화
          name: null,
        },
      });
    }

    const proposals = await prisma.mediaProposal.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        mediaType: true,
        status: true,
        priceMin: true,
        priceMax: true,
        createdAt: true,
      },
    });

    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{t("page_title")}</h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("page_subtitle")}
                </p>
              </div>
              <LanguageSwitcher />
            </div>
          </div>

          <PartnerDashboardClient
            initialProposals={proposals.map((p) => ({
              ...p,
              createdAt: p.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Partner dashboard error:", e);
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white p-6">
          <h1 className="text-lg font-semibold">{t("error_title")}</h1>
          <p className="mt-2 text-sm text-zinc-700">
            {t("error_message")}
          </p>
        </div>
      </div>
    );
  }
}

