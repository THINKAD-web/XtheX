import { NextResponse } from "next/server";
import { UserRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { patchAutoBidRuleSchema } from "@/lib/auto-bid/rule-schema";

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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertAdvertiser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = await prisma.autoBidRule.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchAutoBidRuleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const data: Prisma.AutoBidRuleUpdateInput = {};

  if (d.name !== undefined) data.name = d.name;
  if (d.maxBudgetKrw !== undefined) data.maxBudgetKrw = d.maxBudgetKrw;
  if (d.countryCodes !== undefined) {
    const codes = d.countryCodes.map((c) => c.toUpperCase());
    data.countryCodes = [...new Set(codes)];
  }
  if (d.periodStart !== undefined) data.periodStart = new Date(d.periodStart);
  if (d.periodEnd !== undefined) data.periodEnd = new Date(d.periodEnd);
  if (d.status !== undefined) data.status = d.status;
  if (d.messageTemplate !== undefined) data.messageTemplate = d.messageTemplate.trim();
  if (d.maxInquiriesPerRun !== undefined) data.maxInquiriesPerRun = d.maxInquiriesPerRun;
  if (d.minHoursBetweenRuns !== undefined) data.minHoursBetweenRuns = d.minHoursBetweenRuns;

  if (d.periodStart !== undefined || d.periodEnd !== undefined) {
    const ps = d.periodStart ? new Date(d.periodStart) : existing.periodStart;
    const pe = d.periodEnd ? new Date(d.periodEnd) : existing.periodEnd;
    if (pe <= ps) {
      return NextResponse.json({ error: "period_order" }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const row = await prisma.autoBidRule.update({
    where: { id },
    data,
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

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertAdvertiser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const del = await prisma.autoBidRule.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (del.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
