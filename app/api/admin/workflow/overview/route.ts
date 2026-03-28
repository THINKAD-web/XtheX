import { NextResponse } from "next/server";
import {
  CampaignInvoiceStatus,
  InquiryStatus,
  MediaStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";

export const runtime = "nodejs";

function revenueByMonth(year: number) {
  const keys = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return { key: `${year}-${m}`, label: `${year}-${m}`, paidKrw: 0 };
  });
  return keys;
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const now = new Date();
  const year = now.getUTCFullYear();
  const windowStart = new Date(Date.UTC(year, now.getUTCMonth() - 1, 1));
  const windowEnd = new Date(Date.UTC(year, now.getUTCMonth() + 2, 0, 23, 59, 59, 999));

  const [
    campaigns,
    schedules,
    invoices,
    contracts,
    mediaRows,
    todos,
    crmNotes,
    paidInvoices,
  ] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { updatedAt: "desc" },
      take: 120,
      select: {
        id: true,
        title: true,
        status: true,
        workflowStage: true,
        budget_krw: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.broadcastSchedule.findMany({
      where: {
        AND: [{ startAt: { lte: windowEnd } }, { endAt: { gte: windowStart } }],
      },
      orderBy: { startAt: "asc" },
      take: 400,
      include: {
        campaign: { select: { id: true, title: true } },
        media: { select: { id: true, mediaName: true } },
      },
    }),
    prisma.campaignInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        campaign: { select: { title: true } },
        user: { select: { email: true } },
      },
    }),
    prisma.inquiryContract.findMany({
      orderBy: { updatedAt: "desc" },
      take: 80,
      include: {
        inquiry: {
          select: {
            id: true,
            status: true,
            budget: true,
            advertiser: { select: { email: true } },
            media: { select: { mediaName: true } },
          },
        },
      },
    }),
    prisma.media.findMany({
      where: { status: MediaStatus.PUBLISHED },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: {
        id: true,
        mediaName: true,
        status: true,
        _count: {
          select: {
            inquiries: {
              where: { status: { not: InquiryStatus.CLOSED } },
            },
          },
        },
      },
    }),
    prisma.adminTodo.findMany({
      orderBy: [{ done: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: 80,
      include: {
        assignee: { select: { email: true } },
        createdBy: { select: { email: true } },
      },
    }),
    prisma.adminCrmNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { createdBy: { select: { email: true } } },
    }),
    prisma.campaignInvoice.findMany({
      where: { status: CampaignInvoiceStatus.PAID },
      select: { amountKrw: true, paidAt: true, updatedAt: true },
    }),
  ]);

  const monthTotals = new Map<string, number>();
  for (const inv of paidInvoices) {
    const d = inv.paidAt ?? inv.updatedAt;
    if (d.getUTCFullYear() !== year) continue;
    const key = `${year}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + inv.amountKrw);
  }

  const revenueMonths = revenueByMonth(year).map((m) => ({
    ...m,
    paidKrw: monthTotals.get(m.key) ?? 0,
  }));

  const openInvoiceTotal = await prisma.campaignInvoice.aggregate({
    where: { status: CampaignInvoiceStatus.OPEN },
    _sum: { amountKrw: true },
  });

  return NextResponse.json({
    ok: true,
    campaigns: campaigns.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    schedules: schedules.map((s) => ({
      id: s.id,
      title: s.title,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      notes: s.notes,
      campaignId: s.campaignId,
      mediaId: s.mediaId,
      campaignTitle: s.campaign?.title ?? null,
      mediaName: s.media?.mediaName ?? null,
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      amountKrw: i.amountKrw,
      status: i.status,
      dueAt: i.dueAt.toISOString(),
      paidAt: i.paidAt?.toISOString() ?? null,
      campaignTitle: i.campaign.title?.trim() ?? null,
      userEmail: i.user.email,
    })),
    contracts: contracts.map((c) => ({
      id: c.id,
      status: c.status,
      agreedBudgetKrw: c.agreedBudgetKrw,
      agreedPeriod: c.agreedPeriod,
      inquiryId: c.inquiryId,
      advertiserEmail: c.inquiry.advertiser.email,
      mediaName: c.inquiry.media.mediaName,
      inquiryStatus: c.inquiry.status,
    })),
    mediaBookings: mediaRows.map((m) => ({
      id: m.id,
      mediaName: m.mediaName,
      openInquiries: m._count.inquiries,
    })),
    todos: todos.map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      done: t.done,
      priority: t.priority,
      dueAt: t.dueAt?.toISOString() ?? null,
      assigneeEmail: t.assignee?.email ?? null,
      createdByEmail: t.createdBy.email,
    })),
    crmNotes: crmNotes.map((n) => ({
      id: n.id,
      entityType: n.entityType,
      entityId: n.entityId,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      authorEmail: n.createdBy.email,
    })),
    revenue: {
      year,
      months: revenueMonths,
      openPipelineKrw: openInvoiceTotal._sum.amountKrw ?? 0,
    },
  });
}
