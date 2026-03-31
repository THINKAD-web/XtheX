import { NextResponse } from "next/server";
import { MediaCalendarEventKind, UserRole } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const postSchema = z.object({
  mediaId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  kind: z.nativeEnum(MediaCalendarEventKind),
  note: z.string().max(500).optional(),
  inquiryId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to required (ISO)" }, { status: 400 });
  }
  const fromD = new Date(from);
  const toD = new Date(to);
  if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const events = await prisma.mediaCalendarEvent.findMany({
    where: {
      createdById: userId,
      startAt: { lt: toD },
      endAt: { gt: fromD },
    },
    orderBy: { startAt: "asc" },
    include: {
      media: { select: { id: true, mediaName: true } },
    },
  });

  return NextResponse.json({ ok: true, events });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const media = await prisma.media.findFirst({
    where: { id: parsed.data.mediaId, createdById: userId },
    select: { id: true },
  });
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (endAt <= startAt) {
    return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
  }

  if (parsed.data.inquiryId) {
    const inq = await prisma.inquiry.findFirst({
      where: { id: parsed.data.inquiryId, mediaId: media.id },
      select: { id: true },
    });
    if (!inq) {
      return NextResponse.json({ error: "Inquiry not on this media" }, { status: 400 });
    }
  }

  const ev = await prisma.mediaCalendarEvent.create({
    data: {
      mediaId: media.id,
      createdById: userId,
      startAt,
      endAt,
      kind: parsed.data.kind,
      note: parsed.data.note?.trim() || null,
      inquiryId: parsed.data.inquiryId ?? null,
    },
    include: { media: { select: { id: true, mediaName: true } } },
  });

  return NextResponse.json({ ok: true, event: ev });
}
