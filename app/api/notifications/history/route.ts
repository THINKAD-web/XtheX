import { NextResponse } from "next/server";
import { NotificationType, type Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.nativeEnum(NotificationType).optional(),
  read: z.enum(["all", "read", "unread"]).default("all"),
  starred: z.enum(["all", "1", "0"]).default("all"),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

function dayBoundsUtc(ymd: string, end: boolean): Date {
  if (end) return new Date(`${ymd}T23:59:59.999Z`);
  return new Date(`${ymd}T00:00:00.000Z`);
}

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const q = parsed.data;
  const where: Prisma.NotificationWhereInput = {
    userId: user.id,
  };

  if (q.type) where.type = q.type;

  if (q.read === "read") where.read = true;
  else if (q.read === "unread") where.read = false;

  if (q.starred === "1") where.starred = true;
  else if (q.starred === "0") where.starred = false;

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (q.from) createdAt.gte = dayBoundsUtc(q.from, false);
  if (q.to) createdAt.lte = dayBoundsUtc(q.to, true);
  if (createdAt.gte || createdAt.lte) {
    where.createdAt = createdAt;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: q.take,
      skip: q.skip,
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ notifications, total });
}
