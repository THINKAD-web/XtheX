import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { gateAdminDashboard } from "@/lib/auth/dashboard-gate";
import { createDemoMedias } from "./actions";
import { AdminMediasClient } from "@/components/admin/AdminMediasClient";
import { AdminMediasDaypartShell } from "@/components/admin/AdminMediasDaypartShell";
import { AdminMediasToolbar } from "@/components/admin/AdminMediasToolbar";
import { AdminMediasTrendingDaypart } from "@/components/admin/AdminMediasTrendingDaypart";
import { TrendingMediasSection } from "@/components/medias/TrendingMediasSection";
import { DoohCampaignOnboardingModal } from "@/components/onboarding/DoohCampaignOnboardingModal";
import { AdminMediasList } from "@/components/admin/AdminMediasList";
import {
  buildAdminMediasWhere,
  fetchAdminMediasListPage,
  type AdminMediasReviewFilter,
} from "@/lib/admin/admin-medias-list-query";
import { serializeAdminMediaListRow } from "@/lib/admin/format-admin-media-list-row";

export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Admin Media Review | XtheX",
  description: "Review, approve, and manage all media listings.",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 15;

function parseReviewFilter(raw: string | undefined): AdminMediasReviewFilter {
  if (
    raw === "all" ||
    raw === "pending" ||
    raw === "published" ||
    raw === "rejected"
  ) {
    return raw;
  }
  return "pending";
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ review?: string; page?: string; q?: string }>;
};

export default async function AdminMediasPage({ params, searchParams }: PageProps) {
  const tm = await getTranslations("admin.medias");
  await gateAdminDashboard();

  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  const review = parseReviewFilter(
    typeof sp.review === "string" ? sp.review : undefined,
  );
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);
  const q = typeof sp.q === "string" ? sp.q : "";

  const where = buildAdminMediasWhere(review, q.trim() || undefined);
  const { total, rows: listRows } = await fetchAdminMediasListPage({
    where,
    page,
    pageSize: PAGE_SIZE,
  });

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
      <div className="mx-auto max-w-[1400px] px-4 py-8">
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

        <div className="mb-10">
          <AdminMediasList
            rows={listRows.map(serializeAdminMediaListRow)}
            filter={review}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            q={q}
          />
        </div>

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
