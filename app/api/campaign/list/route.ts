import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ campaigns: [] });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ campaigns: [] }, { status: 401 });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        budget_krw: true,
        duration_weeks: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[GET /api/campaign/list]", e);
    return NextResponse.json({ campaigns: [] });
  }
}
