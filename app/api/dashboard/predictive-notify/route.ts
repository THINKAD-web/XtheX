import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { withRateLimit } from "@/lib/security/rate-limit";
import { createUserNotificationIfEnabled } from "@/lib/notifications/category-prefs";
import {
  buildPredictiveAnalytics,
  PREDICTIVE_NOTIFY_MARKER,
} from "@/lib/predictive/build-predictive-analytics";

export const runtime = "nodejs";

const LOCALES = ["ko", "en", "ja", "zh", "es"] as const;

const BodySchema = z.object({
  locale: z.enum(LOCALES).optional(),
});

const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const rl = withRateLimit(req, { limit: 8, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role === UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let locale: (typeof LOCALES)[number] = "ko";
  try {
    const json = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(json);
    if (parsed.success && parsed.data.locale) locale = parsed.data.locale;
  } catch {
    /* empty body */
  }

  const recent = await prisma.notification.findFirst({
    where: {
      userId,
      message: { contains: PREDICTIVE_NOTIFY_MARKER },
      createdAt: { gte: new Date(Date.now() - NOTIFY_COOLDOWN_MS) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", message: "Already sent in the last 24 hours." },
      { status: 429 },
    );
  }

  const mod = await import(`@/messages/${locale}.json`);
  const copy = mod.default?.dashboard?.predictiveAnalytics as
    | { notify_title?: string; notify_body?: string }
    | undefined;

  const payload = await buildPredictiveAnalytics(userId, locale);
  const pickName = payload.picks[0]?.name ?? "";
  const safePick = pickName.trim().slice(0, 120) || "—";

  const title =
    copy?.notify_title ?? "Predictive insight";
  const bodyTemplate =
    copy?.notify_body ??
    "Open predictive analytics to see regional and seasonal picks tailored to you.";
  const body = bodyTemplate.replace(/\{pick\}/g, safePick) + PREDICTIVE_NOTIFY_MARKER;

  const created = await createUserNotificationIfEnabled({
    userId,
    type: "SYSTEM",
    title,
    message: body,
    link: "/dashboard/advertiser/predictive-analytics",
  });

  if (!created) {
    return NextResponse.json({ ok: false, error: "notifications_disabled" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
