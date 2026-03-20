import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/media/:mediaId/view
// viewCount 필드가 있는 경우에만 increment; 없으면 no-op.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await params;

  try {
    const mediaDelegate = (prisma as any).media;
    if (!mediaDelegate?.update) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await mediaDelegate.update({
      where: { id: mediaId },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // viewCount 필드가 없거나 schema mismatch인 경우
    return NextResponse.json({ ok: true, skipped: true });
  }
}

