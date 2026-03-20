import { auth } from "@clerk/nextjs/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { findUserByClerkId, DatabaseConnectionError } from "@/lib/auth/find-user-by-clerk";
import { ensureAdminUserFromClerk } from "@/lib/auth/ensure-admin-from-clerk";
import { ProposalStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminActions } from "@/components/admin/admin-actions";
import { AdminQuickNav } from "@/components/admin/admin-quick-nav";
import { landing } from "@/lib/landing-theme";
import { AdminDatabaseSetupMessage } from "@/components/admin/admin-database-setup-message";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tHome = await getTranslations("admin.home");

  if (!isDatabaseConfigured()) {
    return (
      <div className="min-h-screen bg-background">
        <section className={landing.section}>
          <div className={landing.container}>
            <AdminDatabaseSetupMessage />
          </div>
        </section>
      </div>
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <section className={landing.section}>
          <div className={landing.container}>
            <div className={`${landing.card} hover:scale-100`}>
              <p className="text-pretty text-base text-zinc-600 dark:text-zinc-400 lg:text-lg">
                {t("common.signIn")}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  let dbUser;
  try {
    dbUser = await findUserByClerkId(userId);
  } catch (e) {
    if (e instanceof DatabaseConnectionError) {
      return (
        <div className="min-h-screen bg-background">
          <section className={landing.section}>
            <div className={landing.container}>
              <AdminDatabaseSetupMessage connectionRefused />
            </div>
          </section>
        </div>
      );
    }
    throw e;
  }
  if (!dbUser) {
    const created = await ensureAdminUserFromClerk();
    if (created) dbUser = created;
  }
  if (!dbUser) {
    return (
      <div className="min-h-screen bg-background">
        <section className={landing.section}>
          <div className={landing.container}>
            <div className={`${landing.card} space-y-4 hover:scale-100`}>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
                {t("common.forbiddenTitle")}
              </h2>
              <p className="text-pretty text-base text-zinc-600 dark:text-zinc-400 lg:text-lg">
                {t("common.userNotFound")}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const [totalProposals, approvedProposals, userCount, pendingProposals] =
    await Promise.all([
      prisma.mediaProposal.count(),
      prisma.mediaProposal.count({ where: { status: ProposalStatus.APPROVED } }),
      prisma.user.count(),
      prisma.mediaProposal.findMany({
        where: { status: ProposalStatus.PENDING },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          mediaType: true,
          priceMin: true,
          priceMax: true,
          size: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);

  const approvalRate =
    totalProposals > 0 ? Math.round((approvedProposals / totalProposals) * 100) : 0;

  const dateLocale =
    locale === "ko"
      ? "ko-KR"
      : locale === "ja"
        ? "ja-JP"
        : locale === "zh"
          ? "zh-CN"
          : locale === "es"
            ? "es-ES"
            : "en-US";

  return (
    <div className="min-h-screen bg-background">
      <section className={landing.section}>
        <div className={landing.container}>
          <div className={landing.sectionStack}>
            <header>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
                {tHome("title")}
              </h2>
              <p className="mt-4 max-w-2xl text-pretty text-left text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
                {tHome("subtitle")}
              </p>
            </header>

            <div className={`${landing.card} hover:scale-100`}>
              <AdminQuickNav locale={locale} t={tHome} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              <div className={landing.card}>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("home.stat_proposals")}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {totalProposals}
                </p>
              </div>
              <div className={landing.card}>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("home.stat_approval")}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {approvalRate}%
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("home.stat_approvedCount", { count: approvedProposals })}
                </p>
              </div>
              <div className={landing.card}>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("home.stat_users")}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {userCount}
                </p>
              </div>
            </div>

            <div className={`${landing.surface} p-4 sm:p-6 lg:p-8`}>
              <div className="flex flex-wrap items-end justify-between gap-4 lg:gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 lg:text-2xl">
                    {t("home.pending_title")}
                  </h3>
                  <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-base">
                    {t("home.pending_subtitle")}
                  </p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t("home.items", { count: pendingProposals.length })}
                </p>
              </div>

              <div className="mt-6 lg:mt-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("home.col_title")}</TableHead>
                      <TableHead>{t("home.col_owner")}</TableHead>
                      <TableHead>{t("home.col_type")}</TableHead>
                      <TableHead>{t("home.col_price")}</TableHead>
                      <TableHead>{t("home.col_size")}</TableHead>
                      <TableHead>{t("home.col_created")}</TableHead>
                      <TableHead>{t("home.col_action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProposals.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell className="text-sm text-zinc-700 dark:text-zinc-300">
                          {p.user.email}
                        </TableCell>
                        <TableCell>{p.mediaType}</TableCell>
                        <TableCell>
                          {p.priceMin != null && p.priceMax != null
                            ? `${p.priceMin.toLocaleString(dateLocale)} ~ ${p.priceMax.toLocaleString(dateLocale)}`
                            : t("common.dash")}
                        </TableCell>
                        <TableCell>{p.size ?? t("common.dash")}</TableCell>
                        <TableCell>
                          {new Date(p.createdAt).toLocaleString(dateLocale)}
                        </TableCell>
                        <TableCell>
                          <AdminActions proposalId={p.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingProposals.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          {t("home.empty_pending")}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
