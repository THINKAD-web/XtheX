import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { getLoginPath } from "@/lib/auth/paths";
import { PartnerDashboardClient } from "@/components/partner/dashboard-client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserMenu } from "@/components/auth/user-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export default async function PartnerDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.partner");
  const loginPath = await getLoginPath();

  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return (
        <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
          <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <Link href={`/${locale}`} className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                XtheX
              </Link>
            </div>
          </header>
          <div className="mx-auto max-w-5xl pt-24">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{t("sign_in")}</p>
              <Link
                href={loginPath}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const proposals = await prisma.mediaProposal.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        summary: true,
        status: true,
        createdAt: true,
      },
    });

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link
              href={`/${locale}`}
              className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              XtheX
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href={`/${locale}/explore`}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                탐색
              </Link>
              <LanguageSwitcher />
              <UserMenu />
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-5xl space-y-8 px-4 pb-12 pt-20">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("page_title")}
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("page_subtitle")}
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {t("welcome", {
                    name: dbUser.name ?? t("default_name"),
                  })}{" "}
                  ({dbUser.role})
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("join_date", {
                    date: new Date(dbUser.createdAt).toLocaleDateString(),
                  })}
                </p>
              </div>
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
    console.error("Partner dashboard error:", e);
    return (
      <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href={`/${locale}`} className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              XtheX
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-5xl pt-24">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("error_title")}</h1>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{t("error_message")}</p>
          </div>
        </div>
      </div>
    );
  }
}
