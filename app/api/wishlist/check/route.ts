import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ wishlisted: false });
  }

  const mediaId = req.nextUrl.searchParams.get("mediaId");
  if (!mediaId) {
    return NextResponse.json({ wishlisted: false });
  }

  const item = await prisma.wishlist.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
    select: { id: true },
  });

  return NextResponse.json({ wishlisted: !!item });
}
