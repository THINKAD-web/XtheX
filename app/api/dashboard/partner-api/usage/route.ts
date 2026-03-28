import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
});

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = new URL(req.url).searchParams;
  const q = QuerySchema.safeParse({ days: sp.get("days") ?? undefined });
  const days = q.success ? (q.data.days ?? 14) : 14;

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  start.setUTCHours(0, 0, 0, 0);

  const usages = await prisma.partnerApiUsage.findMany({
    where: {
      key: { userId: session.user.id },
      createdAt: { gte: start },
    },
    select: {
      createdAt: true,
      path: true,
      method: true,
      status: true,
      keyId: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12_000,
  });

  const byDay = new Map<string, number>();
  const byPath = new Map<string, number>();
  for (const u of usages) {
    const d = u.createdAt.toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
    byPath.set(u.path, (byPath.get(u.path) ?? 0) + 1);
  }

  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const topPaths = [...byPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([path, count]) => ({ path, count }));

  return NextResponse.json({
    ok: true,
    summary: {
      totalRequests: usages.length,
      days,
      since: start.toISOString(),
    },
    daily,
    topPaths,
  });
}
