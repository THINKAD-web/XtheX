import type { Metadata } from "next";
import { MediaStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { gateAdminDashboard } from "@/lib/auth/dashboard-gate";
import { ContentApprovalClient } from "@/components/admin/ContentApprovalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.contentApproval");
  return {
    title: `${t("title")} | XtheX`,
    description: t("subtitle"),
    robots: { index: false, follow: false },
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string }>;
};

export default async function AdminContentApprovalPage({
  params,
  searchParams,
}: PageProps) {
  await gateAdminDashboard();
  const t = await getTranslations("admin.contentApproval");
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const items = await prisma.media.findMany({
    where: {
      status: MediaStatus.PENDING,
      ...(q ? { mediaName: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      mediaName: true,
      category: true,
      createdAt: true,
      createdBy: { select: { email: true, name: true } },
    },
  });

  const serialized = items.map((m) => ({
    id: m.id,
    mediaName: m.mediaName,
    category: m.category,
    submittedAt: m.createdAt.toISOString(),
    ownerEmail: m.createdBy?.email ?? null,
    ownerName: m.createdBy?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form method="get" className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="flex-1"
          aria-label={t("searchPlaceholder")}
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          {t("search")}
        </Button>
      </form>

      <ContentApprovalClient items={serialized} locale={locale} />
    </div>
  );
}
