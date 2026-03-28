import { NextResponse } from "next/server";
import { MediaStatus } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const rl = withRateLimit(req, { limit: 120, windowMs: 60_000 });
  if (rl) return rl;

  const { mediaId } = await params;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ enabled: false, publicKeySpki: null });
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: {
      status: true,
      createdBy: { select: { inquiryE2ePublicKeySpki: true } },
    },
  });

  if (!media || media.status !== MediaStatus.PUBLISHED) {
    return NextResponse.json({ enabled: false, publicKeySpki: null }, { status: 404 });
  }

  const k = media.createdBy?.inquiryE2ePublicKeySpki?.trim() ?? null;
  return NextResponse.json({
    enabled: Boolean(k),
    publicKeySpki: k,
  });
}
