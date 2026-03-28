import { NextResponse } from "next/server";
import { UserActivityCategory, UserRole, type Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";

export const runtime = "nodejs";

const querySchema = z.object({
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  email: z.string().max(200).optional(),
  category: z.nativeEnum(UserActivityCategory).optional(),
  action: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(150),
});

const HEAVY_THRESHOLD = 120;
const BURST_THRESHOLD = 28;
const NEW_USER_SPIKE = 36;
const NEW_USER_DAYS = 2;

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await findUserById(session.user.id);
  if (!dbUser || dbUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const q = parsed.data;
  const to = q.to ? new Date(q.to) : new Date();
  let from = q.from ? new Date(q.from) : new Date(to.getTime() - 14 * 86_400_000);
  if (Number.isNaN(from.getTime())) {
    from = new Date(to.getTime() - 14 * 86_400_000);
  }
  if (Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const newUserCutoff = new Date(Date.now() - NEW_USER_DAYS * 86_400_000);

  const where: Prisma.UserActivityLogWhereInput = {
    createdAt: { gte: from, lte: to },
  };

  if (q.category) where.category = q.category;
  if (q.action?.trim()) {
    where.action = { contains: q.action.trim(), mode: "insensitive" };
  }
  if (q.email?.trim()) {
    where.user = {
      email: { contains: q.email.trim(), mode: "insensitive" },
    };
  }

  try {
    const [logs, seriesRows, categoryRows, heavyUsers, bursts, newUserSpikes] =
      await Promise.all([
        prisma.userActivityLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: q.limit,
          include: {
            user: { select: { email: true, name: true, role: true } },
          },
        }),
        prisma.$queryRaw<Array<{ d: Date; c: bigint }>>`
          SELECT (l."createdAt" AT TIME ZONE 'UTC')::date AS d, COUNT(*)::bigint AS c
          FROM "UserActivityLog" l
          WHERE l."createdAt" >= ${from} AND l."createdAt" <= ${to}
          GROUP BY 1
          ORDER BY 1 ASC
        `,
        prisma.$queryRaw<Array<{ category: string; c: bigint }>>`
          SELECT l."category"::text AS category, COUNT(*)::bigint AS c
          FROM "UserActivityLog" l
          WHERE l."createdAt" >= ${from} AND l."createdAt" <= ${to}
          GROUP BY l."category"
          ORDER BY c DESC
        `,
        prisma.$queryRaw<Array<{ userId: string; c: bigint }>>`
          SELECT l."userId", COUNT(*)::bigint AS c
          FROM "UserActivityLog" l
          WHERE l."createdAt" >= ${from} AND l."createdAt" <= ${to}
          GROUP BY l."userId"
          HAVING COUNT(*) > ${HEAVY_THRESHOLD}
          ORDER BY c DESC
          LIMIT 30
        `,
        prisma.$queryRaw<Array<{ userId: string; win: bigint; c: bigint }>>`
          SELECT l."userId",
                 (EXTRACT(EPOCH FROM l."createdAt")::bigint / 600) AS win,
                 COUNT(*)::bigint AS c
          FROM "UserActivityLog" l
          WHERE l."createdAt" >= ${from} AND l."createdAt" <= ${to}
          GROUP BY l."userId", win
          HAVING COUNT(*) > ${BURST_THRESHOLD}
          ORDER BY c DESC
          LIMIT 50
        `,
        prisma.$queryRaw<Array<{ userId: string; c: bigint }>>`
          SELECT l."userId", COUNT(*)::bigint AS c
          FROM "UserActivityLog" l
          INNER JOIN "User" u ON u.id = l."userId"
          WHERE l."createdAt" >= ${from}
            AND l."createdAt" <= ${to}
            AND u."createdAt" >= ${newUserCutoff}
          GROUP BY l."userId"
          HAVING COUNT(*) > ${NEW_USER_SPIKE}
          ORDER BY c DESC
          LIMIT 25
        `,
      ]);

    const anomalies: Array<{
      code: "HIGH_VOLUME" | "BURST_WINDOW" | "NEW_ACCOUNT_SPIKE";
      severity: "medium" | "high";
      userId: string;
      count: number;
    }> = [];

    for (const row of heavyUsers) {
      anomalies.push({
        code: "HIGH_VOLUME",
        severity: Number(row.c) > 300 ? "high" : "medium",
        userId: row.userId,
        count: Number(row.c),
      });
    }

    const burstByUser = new Map<string, number>();
    for (const row of bursts) {
      const prev = burstByUser.get(row.userId) ?? 0;
      burstByUser.set(row.userId, Math.max(prev, Number(row.c)));
    }
    for (const [userId, count] of burstByUser) {
      anomalies.push({
        code: "BURST_WINDOW",
        severity: count > 45 ? "high" : "medium",
        userId,
        count,
      });
    }

    for (const row of newUserSpikes) {
      anomalies.push({
        code: "NEW_ACCOUNT_SPIKE",
        severity: "high",
        userId: row.userId,
        count: Number(row.c),
      });
    }

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      seriesByDay: seriesRows.map((r) => ({
        date: r.d.toISOString().slice(0, 10),
        count: Number(r.c),
      })),
      byCategory: categoryRows.map((r) => ({
        category: r.category,
        count: Number(r.c),
      })),
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        email: l.user.email,
        name: l.user.name,
        role: l.user.role,
        action: l.action,
        category: l.category,
        meta: l.meta,
        createdAt: l.createdAt.toISOString(),
      })),
      anomalies,
    });
  } catch (e) {
    console.error("[admin/user-analytics]", e);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
