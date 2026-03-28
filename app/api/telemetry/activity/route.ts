import { NextResponse } from "next/server";
import { UserActivityCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { logUserActivity } from "@/lib/analytics/log-user-activity";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.string().min(1).max(160),
  category: z.nativeEnum(UserActivityCategory),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const HOURLY_CAP = 400;

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const hourAgo = new Date(Date.now() - 3_600_000);
    const recent = await prisma.userActivityLog.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: hourAgo },
      },
    });
    if (recent >= HOURLY_CAP) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ ok: true });
  }

  await logUserActivity({
    userId: session.user.id,
    action: parsed.data.action,
    category: parsed.data.category,
    meta: parsed.data.meta ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
