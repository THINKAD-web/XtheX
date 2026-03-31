import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Lightweight ROI snapshot: ledger spend vs. approved campaign budget (planned).
 * Extend with impression pixels / attribution when available.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.ADVERTISER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [spentAgg, plannedAgg, campaigns] = await Promise.all([
    prisma.advertiserLedgerEntry.aggregate({
      where: { userId },
      _sum: { amountKrw: true },
    }),
    prisma.campaign.aggregate({
      where: { userId, status: "APPROVED" },
      _sum: { budget_krw: true },
    }),
    prisma.campaign.count({ where: { userId, status: "APPROVED" } }),
  ]);

  const spent = spentAgg._sum.amountKrw ?? 0;
  const planned = plannedAgg._sum.budget_krw ?? 0;
  const utilization = planned > 0 ? Math.min(1, spent / planned) : null;
  /** Heuristic “score” for dashboard display only */
  const roiScore =
    planned > 0 && spent > 0
      ? Math.round((planned / spent) * 50 + Math.min(50, campaigns * 5))
      : null;

  return NextResponse.json({
    ok: true,
    spentKrw: spent,
    approvedCampaignBudgetKrw: planned,
    approvedCampaignCount: campaigns,
    budgetUtilization: utilization,
    roiScore,
  });
}
