import { MediaStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUserNotificationIfEnabled } from "@/lib/notifications/category-prefs";
import { parseCountryCodesJson } from "./parse-countries";

function formatPeriod(start: Date, end: Date): string {
  const a = start.toISOString().slice(0, 10);
  const b = end.toISOString().slice(0, 10);
  return `${a} ~ ${b}`;
}

function applyTemplate(
  tpl: string,
  vars: { mediaName: string; budget: string; period: string },
): string {
  return tpl
    .replace(/\{mediaName\}/g, vars.mediaName)
    .replace(/\{budget\}/g, vars.budget)
    .replace(/\{period\}/g, vars.period);
}

export type ExecuteAutoBidResult =
  | { ok: true; created: number; inquiryIds: string[]; runId: string }
  | { ok: false; error: string };

export async function executeAutoBidRule(
  ruleId: string,
  options: { bypassCooldown?: boolean; userIdMustMatch?: string } = {},
): Promise<ExecuteAutoBidResult> {
  const rule = await prisma.autoBidRule.findUnique({
    where: { id: ruleId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!rule) return { ok: false, error: "not_found" };
  if (options.userIdMustMatch && rule.userId !== options.userIdMustMatch) {
    return { ok: false, error: "forbidden" };
  }

  if (rule.status !== "ACTIVE") {
    return { ok: false, error: "not_active" };
  }

  const now = new Date();
  if (now < rule.periodStart || now > rule.periodEnd) {
    return { ok: false, error: "outside_period" };
  }

  if (!options.bypassCooldown && rule.lastRunAt) {
    const ms = rule.minHoursBetweenRuns * 60 * 60 * 1000;
    if (now.getTime() - rule.lastRunAt.getTime() < ms) {
      return { ok: false, error: "cooldown" };
    }
  }

  const countries = parseCountryCodesJson(rule.countryCodes);
  const contactEmail = rule.user.email?.trim().toLowerCase();
  if (!contactEmail) {
    return { ok: false, error: "no_email" };
  }

  const periodLabel = formatPeriod(rule.periodStart, rule.periodEnd);
  const budgetLabel = `${rule.maxBudgetKrw.toLocaleString("ko-KR")}`;

  const whereBase = {
    status: MediaStatus.PUBLISHED,
    OR: [{ price: null }, { price: { lte: rule.maxBudgetKrw } }],
    ...(countries.length > 0 ?
      { globalCountryCode: { in: countries } }
    : {}),
  };

  const candidates = await prisma.media.findMany({
    where: whereBase,
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: Math.max(rule.maxInquiriesPerRun * 8, 24),
    select: { id: true, mediaName: true },
  });

  if (candidates.length === 0) {
    await prisma.autoBidRule.update({
      where: { id: ruleId },
      data: { lastRunAt: now },
    });
    const run = await prisma.autoBidRun.create({
      data: {
        ruleId,
        userId: rule.userId,
        matchedCount: 0,
        createdInquiryIds: [],
      },
    });
    return { ok: true, created: 0, inquiryIds: [], runId: run.id };
  }

  const existing = await prisma.inquiry.findMany({
    where: {
      advertiserId: rule.userId,
      mediaId: { in: candidates.map((c) => c.id) },
    },
    select: { mediaId: true },
  });
  const hasInquiry = new Set(existing.map((e) => e.mediaId));

  const picked = candidates.filter((c) => !hasInquiry.has(c.id)).slice(0, rule.maxInquiriesPerRun);

  if (picked.length === 0) {
    await prisma.autoBidRule.update({
      where: { id: ruleId },
      data: { lastRunAt: now },
    });
    const run = await prisma.autoBidRun.create({
      data: {
        ruleId,
        userId: rule.userId,
        matchedCount: 0,
        createdInquiryIds: [],
      },
    });
    return { ok: true, created: 0, inquiryIds: [], runId: run.id };
  }

  const inquiryIds: string[] = [];
  let runId = "";

  await prisma.$transaction(async (tx) => {
    for (const m of picked) {
      const message = applyTemplate(rule.messageTemplate, {
        mediaName: m.mediaName,
        budget: budgetLabel,
        period: periodLabel,
      });
      const safeMessage = message.trim().length >= 5 ? message.trim() : `${message.trim()} — 자동 입찰 문의`;

      const row = await tx.inquiry.create({
        data: {
          advertiserId: rule.userId,
          mediaId: m.id,
          message: safeMessage,
          desiredPeriod: periodLabel,
          budget: rule.maxBudgetKrw,
          contactEmail,
          contactPhone: null,
          status: "PENDING",
        },
        select: { id: true },
      });
      inquiryIds.push(row.id);
    }

    await tx.autoBidRule.update({
      where: { id: ruleId },
      data: { lastRunAt: now },
    });

    const run = await tx.autoBidRun.create({
      data: {
        ruleId,
        userId: rule.userId,
        matchedCount: picked.length,
        createdInquiryIds: inquiryIds,
      },
      select: { id: true },
    });
    runId = run.id;
  });

  if (inquiryIds.length > 0) {
    await createUserNotificationIfEnabled({
      userId: rule.userId,
      type: "SYSTEM",
      title: "자동 입찰 실행됨",
      message: `조건에 맞는 ${inquiryIds.length}건의 매체에 문의를 보냈습니다. 내 문의함에서 확인하세요.`,
      link: "/dashboard/advertiser/inquiries",
    });
  }

  return {
    ok: true,
    created: inquiryIds.length,
    inquiryIds,
    runId,
  };
}

export async function executeAllDueAutoBidRules(): Promise<{
  eligible: number;
  processed: number;
  totalCreated: number;
}> {
  const now = new Date();
  const active = await prisma.autoBidRule.findMany({
    where: {
      status: "ACTIVE",
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
    select: { id: true, lastRunAt: true, minHoursBetweenRuns: true },
  });

  let totalCreated = 0;
  let processed = 0;
  for (const r of active) {
    if (r.lastRunAt) {
      const ms = r.minHoursBetweenRuns * 60 * 60 * 1000;
      if (now.getTime() - r.lastRunAt.getTime() < ms) continue;
    }
    processed += 1;
    const res = await executeAutoBidRule(r.id, { bypassCooldown: false });
    if (res.ok) totalCreated += res.created;
  }

  return { eligible: active.length, processed, totalCreated };
}
