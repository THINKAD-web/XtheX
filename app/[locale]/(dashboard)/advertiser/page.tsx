import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { landing } from "@/lib/landing-theme";
import { AdvertiserCampaignsSection } from "./advertiser-campaigns-section";

export const runtime = "nodejs";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

function AdvertiserTableSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="캠페인 목록 로딩">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80"
          />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80" />
    </div>
  );
}

export default function AdvertiserPage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className={`${landing.container} space-y-8 py-12 lg:space-y-10 lg:py-16`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
              광고주 · 캠페인
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
              로그인한 계정의 캠페인만 표시됩니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/#media-mix-ai" className={landing.btnPrimary}>
              새 캠페인 만들기
            </Link>
            <LanguageSwitcher />
          </div>
        </div>

        <Suspense fallback={<AdvertiserTableSkeleton />}>
          <AdvertiserCampaignsSection searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
