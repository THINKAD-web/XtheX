import Link from "next/link";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { getTranslations } from "next-intl/server";
import { generateWeeklyReport } from "@/lib/reports/generate-summary";
import type { PeriodSummary } from "@/lib/reports/generate-summary";

function dateLocale(locale: string) {
  if (locale === "ko") return "ko-KR";
  if (locale === "ja") return "ja-JP";
  if (locale === "zh") return "zh-CN";
  if (locale === "es") return "es-ES";
  return "en-US";
}

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tr = await getTranslations("admin.reports");
  const user = await getCurrentUser();
  const dl = dateLocale(locale);

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-zinc-400">{tr("signIn")}</p>
        </div>
      </div>
    );
  }

  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-zinc-400">{tr("noAccess")}</p>
        </div>
      </div>
    );
  }

  const { weekly, monthly } = await generateWeeklyReport();

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{tr("title")}</h1>
            <p className="mt-1 text-sm text-zinc-400">{tr("subtitle")}</p>
          </div>
          <Link
            href={`/${locale}/admin`}
            className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            {t("common.adminHome")}
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ReportCard
            title={tr("period7")}
            summary={weekly}
            tr={tr}
            dateLocale={dl}
          />
          <ReportCard
            title={tr("period30")}
            summary={monthly}
            tr={tr}
            dateLocale={dl}
          />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
          <p className="font-medium text-zinc-300">{tr("cron_title")}</p>
          <p className="mt-2">
            <code className="rounded bg-zinc-800 px-1">
              GET /api/cron/weekly-report
            </code>{" "}
            {tr("cron_p1")}{" "}
            <code className="rounded bg-zinc-800 px-1">
              Authorization: Bearer CRON_SECRET
            </code>{" "}
            {tr("cron_p2")}
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-xs">
            <li>{tr("cron_li_slack")}</li>
            <li>{tr("cron_li_email")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  summary,
  tr,
  dateLocale: dl,
}: {
  title: string;
  summary: PeriodSummary;
  tr: (key: string, values?: Record<string, string | number>) => string;
  dateLocale: string;
}) {
  const since = new Date(summary.since).toLocaleDateString(dl);
  const until = new Date(summary.until).toLocaleDateString(dl);
  const daysLabel = tr("days_unit", { count: summary.days });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <p className="mt-1 text-xs text-zinc-500">
        {since} ~ {until} ({daysLabel})
      </p>

      <dl className="mt-4 space-y-3">
        <StatRow
          label={tr("stat_media")}
          value={summary.mediaPublished}
          note={tr("note_total", { sub: summary.totals.mediaPublished })}
        />
        <StatRow
          label={tr("stat_inquiries")}
          value={summary.inquiries}
          note={tr("note_total", { sub: summary.totals.inquiries })}
        />
        <StatRow
          label={tr("stat_proposals")}
          value={summary.proposals}
          note={`${tr("stat_proposals_sub", {
            approved: summary.proposalsApproved,
            pending: summary.proposalsPending,
          })} · ${tr("note_total", { sub: summary.totals.proposals })}`}
        />
        <StatRow
          label={tr("stat_campaigns")}
          value={summary.campaignDrafts}
          note={tr("note_total", { sub: summary.totals.campaignDrafts })}
        />
      </dl>
    </div>
  );
}

function StatRow({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="flex justify-between gap-2 border-t border-zinc-800 pt-3">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="text-right">
        <span className="font-semibold text-zinc-100">{value}</span>
        <span className="ml-2 text-xs text-zinc-500">({note})</span>
      </dd>
    </div>
  );
}
