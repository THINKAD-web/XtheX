import { CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { CampaignTable } from "@/components/campaigns/campaign-table";

export const runtime = "nodejs";

const VALID_STATUS = new Set<CampaignStatus>([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
]);

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export async function AdvertiserCampaignsSection({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const sp = await searchParams;
  const raw = sp.status?.toUpperCase();
  const activeFilter =
    raw && VALID_STATUS.has(raw as CampaignStatus) ? raw : "ALL";
  const statusFilter =
    activeFilter !== "ALL" && VALID_STATUS.has(activeFilter as CampaignStatus)
      ? (activeFilter as CampaignStatus)
      : undefined;

  let campaigns;
  try {
    campaigns = await prisma.campaign.findMany({
      where: {
        userId: user.id,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        budget_krw: true,
        duration_weeks: true,
        createdAt: true,
        omniChannel: true,
      },
    });
  } catch (e) {
    console.error("[AdvertiserCampaignsSection] prisma.campaign.findMany", e);
    throw new Error("캠페인 목록을 불러오지 못했습니다.");
  }

  const rows = campaigns.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  const total = campaigns.length;
  const draftN = campaigns.filter((c) => c.status === "DRAFT").length;
  const submittedN = campaigns.filter((c) => c.status === "SUBMITTED").length;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        {[
          { label: "전체", value: total },
          { label: "초안", value: draftN },
          { label: "제출됨", value: submittedN },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-black/30"
          >
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {s.label}
            </span>
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <CampaignTable
        campaigns={rows}
        activeFilter={activeFilter}
        listBasePath="/advertiser"
      />
    </>
  );
}
