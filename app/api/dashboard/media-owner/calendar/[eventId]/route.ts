import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ev = await prisma.mediaCalendarEvent.findFirst({
    where: { id: eventId, createdById: userId },
    select: { id: true },
  });
  if (!ev) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.mediaCalendarEvent.delete({ where: { id: ev.id } });
  return NextResponse.json({ ok: true });
}
