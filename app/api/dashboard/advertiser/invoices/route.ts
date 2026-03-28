import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

async function assertAdvertiser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== UserRole.ADVERTISER && user.role !== UserRole.ADMIN)) {
    return null;
  }
  return user;
}

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertAdvertiser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.campaignInvoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      campaign: { select: { id: true, title: true, status: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    invoices: rows.map((r) => ({
      id: r.id,
      campaignId: r.campaignId,
      campaignTitle: r.campaign.title?.trim() || null,
      campaignStatus: r.campaign.status,
      amountKrw: r.amountKrw,
      campaignEndAt: r.campaignEndAt.toISOString(),
      dueAt: r.dueAt.toISOString(),
      status: r.status,
      initialEmailSentAt: r.initialEmailSentAt?.toISOString() ?? null,
      lastReminderAt: r.lastReminderAt?.toISOString() ?? null,
      reminderCount: r.reminderCount,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
