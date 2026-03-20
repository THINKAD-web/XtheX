import { prisma } from "@/lib/prisma";

export type PeriodSummary = {
  since: string; // ISO
  until: string;
  days: number;
  mediaPublished: number;
  inquiries: number;
  proposals: number;
  proposalsApproved: number;
  proposalsPending: number;
  campaignDrafts: number;
  totals: {
    mediaPublished: number;
    inquiries: number;
    proposals: number;
    campaignDrafts: number;
  };
};

export async function generatePeriodSummary(since: Date): Promise<PeriodSummary> {
  const until = new Date();
  const days = Math.round((until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));

  const [
    mediaPublished,
    inquiries,
    proposals,
    proposalsApproved,
    proposalsPending,
    campaignDrafts,
    totalMedia,
    totalInquiries,
    totalProposals,
    totalDrafts,
  ] = await Promise.all([
    prisma.media.count({ where: { status: "PUBLISHED", createdAt: { gte: since } } }),
    typeof (prisma as any).inquiry?.count === "function"
      ? (prisma as any).inquiry.count({ where: { createdAt: { gte: since } } })
      : Promise.resolve(0),
    prisma.mediaProposal.count({ where: { createdAt: { gte: since } } }),
    prisma.mediaProposal.count({
      where: { createdAt: { gte: since }, status: "APPROVED" },
    }),
    prisma.mediaProposal.count({
      where: { createdAt: { gte: since }, status: "PENDING" },
    }),
    (prisma as any).campaignDraft?.count?.({ where: { createdAt: { gte: since } } }) ??
      Promise.resolve(0),
    prisma.media.count({ where: { status: "PUBLISHED" } }),
    typeof (prisma as any).inquiry?.count === "function"
      ? (prisma as any).inquiry.count()
      : Promise.resolve(0),
    prisma.mediaProposal.count(),
    (prisma as any).campaignDraft?.count?.() ?? Promise.resolve(0),
  ]);

  return {
    since: since.toISOString(),
    until: until.toISOString(),
    days,
    mediaPublished,
    inquiries,
    proposals,
    proposalsApproved,
    proposalsPending,
    campaignDrafts,
    totals: {
      mediaPublished: totalMedia,
      inquiries: totalInquiries,
      proposals: totalProposals,
      campaignDrafts: totalDrafts,
    },
  };
}

export async function generateWeeklyReport(): Promise<{
  weekly: PeriodSummary;
  monthly: PeriodSummary;
}> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [weekly, monthly] = await Promise.all([
    generatePeriodSummary(weekAgo),
    generatePeriodSummary(monthAgo),
  ]);

  return { weekly, monthly };
}
