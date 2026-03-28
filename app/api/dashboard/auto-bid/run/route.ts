import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { executeAutoBidRule } from "@/lib/auto-bid/execute-rule";

export const runtime = "nodejs";

const BodySchema = z.object({
  ruleId: z.string().uuid().optional(),
  force: z.boolean().optional(),
});

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

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertAdvertiser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    /* empty */
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { ruleId, force } = parsed.data;
  const bypassCooldown = Boolean(force);

  if (ruleId) {
    const owned = await prisma.autoBidRule.findFirst({
      where: { id: ruleId, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const res = await executeAutoBidRule(ruleId, {
      bypassCooldown,
      userIdMustMatch: session.user.id,
    });
    if (!res.ok) {
      const status =
        res.error === "not_found" ? 404
        : res.error === "forbidden" ? 403
        : res.error === "cooldown" ? 429
        : 400;
      return NextResponse.json({ ok: false, error: res.error }, { status });
    }
    return NextResponse.json({
      ok: true,
      results: [{ ruleId, created: res.created, inquiryIds: res.inquiryIds, runId: res.runId }],
    });
  }

  const rules = await prisma.autoBidRule.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { id: true },
  });

  const results: {
    ruleId: string;
    created: number;
    inquiryIds: string[];
    runId: string;
    error?: string;
  }[] = [];

  for (const r of rules) {
    const res = await executeAutoBidRule(r.id, {
      bypassCooldown,
      userIdMustMatch: session.user.id,
    });
    if (res.ok) {
      results.push({
        ruleId: r.id,
        created: res.created,
        inquiryIds: res.inquiryIds,
        runId: res.runId,
      });
    } else {
      results.push({
        ruleId: r.id,
        created: 0,
        inquiryIds: [],
        runId: "",
        error: res.error,
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
