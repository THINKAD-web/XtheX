import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/rbac";
import { PartnershipAdminClient } from "@/components/admin/PartnershipAdminClient";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const panel =
  "rounded-2xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]";

export const metadata: Metadata = {
  title: "Partnerships | XtheX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPartnershipsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tp = await getTranslations("admin.partnerships");
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className={cn(panel, "mx-auto max-w-6xl p-6")}>
          <p className="text-sm text-muted-foreground">{t("common.signIn")}</p>
        </div>
      </div>
    );
  }

  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className={cn(panel, "mx-auto max-w-6xl p-6")}>
          <p className="text-sm text-muted-foreground">{t("common.adminOnly")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className={cn(panel, "mx-auto max-w-6xl space-y-6 p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className="text-sm text-primary hover:underline">
              {t("common.backAdmin")}
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{tp("page_title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{tp("page_subtitle")}</p>
          </div>
        </div>
        <PartnershipAdminClient locale={locale} />
      </div>
    </div>
  );
}
