import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.ADVERTISER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.advertiserLedgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      kind: true,
      amountKrw: true,
      description: true,
      inquiryId: true,
      createdAt: true,
    },
  });

  const sum = await prisma.advertiserLedgerEntry.aggregate({
    where: { userId },
    _sum: { amountKrw: true },
  });

  return NextResponse.json({
    ok: true,
    totalSpentKrw: sum._sum.amountKrw ?? 0,
    entries: rows,
  });
}
