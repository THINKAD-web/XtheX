import type { Metadata } from "next";
import { UserRole, ProposalStatus } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { findUserById, DatabaseConnectionError } from "@/lib/auth/find-user-by-clerk";
import { ensureAdminUserFromSession } from "@/lib/auth/ensure-admin-from-session";
import { getAuthSession } from "@/lib/auth/session";
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
import { AdminNewsFetchButton } from "@/components/admin/admin-news-fetch-button";
import { AdminDatabaseSetupMessage } from "@/components/admin/admin-database-setup-message";
import { cn } from "@/lib/utils";

const panel =
  "rounded-2xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]";

export const metadata: Metadata = {
  title: "Admin Dashboard | XtheX",
  description: "Manage platform operations, proposals, and users.",
  robots: { index: false, follow: false },
};

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
        <section className="relative border-t border-border bg-gradient-to-b from-muted/30 to-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AdminDatabaseSetupMessage />
          </div>
        </section>
      </div>
    );
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-background">
        <section className="relative border-t border-border bg-gradient-to-b from-muted/30 to-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={cn(panel, "p-6")}>
              <p className="text-pretty text-base text-muted-foreground lg:text-lg">{t("common.signIn")}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  let dbUser;
  try {
    dbUser = await findUserById(session.user.id);
  } catch (e) {
    if (e instanceof DatabaseConnectionError) {
      return (
        <div className="min-h-screen bg-background">
          <section className="relative border-t border-border bg-gradient-to-b from-muted/30 to-background py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <AdminDatabaseSetupMessage connectionRefused />
            </div>
          </section>
        </div>
      );
    }
    throw e;
  }
  if (!dbUser) {
    const created = await ensureAdminUserFromSession();
    if (created) dbUser = created;
  }
  if (!dbUser) {
    return (
      <div className="min-h-screen bg-background">
        <section className="relative border-t border-border bg-gradient-to-b from-muted/30 to-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={cn(panel, "space-y-4 p-6")}>
              <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {t("common.forbiddenTitle")}
              </h2>
              <p className="text-pretty text-base text-muted-foreground lg:text-lg">{t("common.userNotFound")}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (dbUser.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-background">
        <section className="relative border-t border-border bg-gradient-to-b from-muted/30 to-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={cn(panel, "space-y-4 p-6")}>
              <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {t("common.forbiddenTitle")}
              </h2>
              <p className="text-pretty text-base text-muted-foreground lg:text-lg">
                {t("common.adminOnly")}
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
      <section className="relative border-t border-border bg-gradient-to-b from-muted/30 via-background to-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12 lg:space-y-16">
            <header>
              <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">{tHome("title")}</h1>
              <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground lg:text-lg">
                {tHome("subtitle")}
              </p>
            </header>

            <div className={cn(panel, "p-6 sm:p-8")}>
              <AdminQuickNav t={tHome} />
            </div>

            <div className={cn(panel, "p-6 sm:p-8")}>
              <p className="mb-4 text-sm font-semibold text-foreground">RSS 뉴스 관리</p>
              <AdminNewsFetchButton />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              <div className={cn(panel, "p-5 sm:p-6")}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("home.stat_proposals")}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{totalProposals}</p>
              </div>
              <div className={cn(panel, "p-5 sm:p-6")}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("home.stat_approval")}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{approvalRate}%</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("home.stat_approvedCount", { count: approvedProposals })}
                </p>
              </div>
              <div className={cn(panel, "p-5 sm:p-6")}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("home.stat_users")}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{userCount}</p>
              </div>
            </div>

            <div className={cn(panel, "overflow-hidden p-4 sm:p-6 lg:p-8")}>
              <div className="flex flex-wrap items-end justify-between gap-4 lg:gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground lg:text-2xl">{t("home.pending_title")}</h2>
                  <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground lg:text-base">
                    {t("home.pending_subtitle")}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{t("home.items", { count: pendingProposals.length })}</p>
              </div>

              <div className="mt-6 overflow-x-auto lg:mt-8">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-foreground">{t("home.col_title")}</TableHead>
                      <TableHead className="text-foreground">{t("home.col_owner")}</TableHead>
                      <TableHead className="text-foreground">{t("home.col_type")}</TableHead>
                      <TableHead className="text-foreground">{t("home.col_price")}</TableHead>
                      <TableHead className="text-foreground">{t("home.col_size")}</TableHead>
                      <TableHead className="text-foreground">{t("home.col_created")}</TableHead>
                      <TableHead className="text-foreground">{t("home.col_action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProposals.map((p) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{p.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.user.email}</TableCell>
                        <TableCell className="text-foreground">{p.mediaType}</TableCell>
                        <TableCell className="text-foreground">
                          {p.priceMin != null && p.priceMax != null
                            ? `${p.priceMin.toLocaleString(dateLocale)} ~ ${p.priceMax.toLocaleString(dateLocale)}`
                            : t("common.dash")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.size ?? t("common.dash")}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(p.createdAt).toLocaleString(dateLocale)}
                        </TableCell>
                        <TableCell>
                          <AdminActions proposalId={p.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingProposals.length === 0 ? (
                      <TableRow className="border-border hover:bg-transparent">
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
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
