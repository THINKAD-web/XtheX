import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { assertInquiryThreadAccess } from "@/lib/inquiry/assert-thread-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** 현재 사용자가 상대방 메시지를 읽음 처리(내가 보낸 메시지의 읽음 표시에 사용). */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || (role !== UserRole.ADVERTISER && role !== UserRole.MEDIA_OWNER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const gate = await assertInquiryThreadAccess(id, userId, role);
  if (!gate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const res = await prisma.inquiryThreadMessage.updateMany({
    where: {
      inquiryId: id,
      authorId: { not: userId },
      readAt: null,
    },
    data: { readAt: now },
  });

  return NextResponse.json({ ok: true, marked: res.count });
}
