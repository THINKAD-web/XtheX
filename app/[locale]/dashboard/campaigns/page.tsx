import { redirect } from "next/navigation";
import { CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { CampaignsDashboardClient } from "@/components/campaigns/CampaignsDashboardClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { landing } from "@/lib/landing-theme";

export const runtime = "nodejs";

const VALID_STATUS = new Set<CampaignStatus>([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
]);

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdvertiserCampaignsPage({
  searchParams,
}: PageProps) {
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

  const campaigns = await prisma.campaign.findMany({
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

  const rows = campaigns.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  const total = campaigns.length;
  const draftN = campaigns.filter((c) => c.status === "DRAFT").length;
  const submittedN = campaigns.filter((c) => c.status === "SUBMITTED").length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className={`${landing.container} space-y-8 py-12 lg:space-y-10 lg:py-16`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
              내 캠페인
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
              미디어 믹스로 저장한 캠페인을 관리합니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/#media-mix-ai" className={landing.btnPrimary}>
              새 캠페인 만들기
            </Link>
            <LanguageSwitcher />
          </div>
        </div>

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

        <CampaignsDashboardClient
          campaigns={rows}
          activeFilter={activeFilter}
        />
      </div>
    </div>
  );
}
