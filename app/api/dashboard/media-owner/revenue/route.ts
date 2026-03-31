import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { getMediaOwnerRevenueSummary } from "@/lib/media-owner/revenue-summary";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { totalKrw, rows } = await getMediaOwnerRevenueSummary(userId);

  return NextResponse.json({
    ok: true,
    totalKrw,
    paymentCount: rows.length,
    recent: rows.slice(0, 20).map((r) => ({
      source: r.source,
      amountKrw: r.amountKrw,
      at: r.at.toISOString(),
      mediaName: r.mediaName,
    })),
  });
}
