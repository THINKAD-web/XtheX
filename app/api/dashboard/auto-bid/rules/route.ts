import { NextResponse } from "next/server";
import { UserRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { createAutoBidRuleSchema } from "@/lib/auto-bid/rule-schema";
export const runtime = "nodejs";

async function assertAdvertiser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== UserRole.ADVERTISER && user.role !== UserRole.ADMIN)) {
    return null;
  }
  return user;
}

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertAdvertiser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.autoBidRule.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    rules: rows.map((r) => ({
      ...r,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      lastRunAt: r.lastRunAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertAdvertiser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAutoBidRuleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const codes = (d.countryCodes ?? []).map((c) => c.toUpperCase());
  const countryCodesJson: Prisma.InputJsonValue = [...new Set(codes)];

  const row = await prisma.autoBidRule.create({
    data: {
      userId: session.user.id,
      name: d.name,
      maxBudgetKrw: d.maxBudgetKrw,
      countryCodes: countryCodesJson,
      periodStart: new Date(d.periodStart),
      periodEnd: new Date(d.periodEnd),
      status: d.status ?? "PAUSED",
      messageTemplate: d.messageTemplate.trim(),
      maxInquiriesPerRun: d.maxInquiriesPerRun ?? 5,
      minHoursBetweenRuns: d.minHoursBetweenRuns ?? 6,
    },
  });

  return NextResponse.json({
    ok: true,
    rule: {
      ...row,
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      lastRunAt: row.lastRunAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}
