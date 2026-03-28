import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";
import { normalizeNotificationPrefs } from "@/lib/notifications/prefs-shared";

export const runtime = "nodejs";

const categorySchema = z.object({
  INQUIRY_RECEIVED: z.boolean(),
  MEDIA_APPROVED: z.boolean(),
  MEDIA_REJECTED: z.boolean(),
  CAMPAIGN_UPDATE: z.boolean(),
  SYSTEM: z.boolean(),
});

const channelsSchema = z.object({
  push: z.boolean(),
  email: z.boolean(),
  sms: z.boolean(),
});

/** Accepts HTML time (HH:mm or HH:mm:ss). */
const hhmmSchema = z.string().transform((s) => {
  const parts = s.trim().split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt((parts[1] ?? "0").replace(/\D/g, "").slice(0, 2), 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "00:00";
  const hh = Math.min(23, Math.max(0, h));
  const mm = Math.min(59, Math.max(0, m));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
});

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string().min(1).max(80),
  start: hhmmSchema,
  end: hhmmSchema,
});

const prefsBodySchema = z.object({
  categories: categorySchema,
  channels: channelsSchema,
  quietHours: quietHoursSchema,
});

const putBodySchema = z.object({
  prefs: prefsBodySchema,
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      prefs: normalizeNotificationPrefs(null),
      demo: true,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationCategoryPrefs: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    prefs: normalizeNotificationPrefs(user.notificationCategoryPrefs),
  });
}

export async function PUT(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = putBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const normalized = normalizeNotificationPrefs(parsed.data.prefs);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      notificationCategoryPrefs: normalized as unknown as Prisma.InputJsonValue,
    },
    select: { notificationCategoryPrefs: true },
  });

  return NextResponse.json({
    ok: true,
    prefs: normalizeNotificationPrefs(updated.notificationCategoryPrefs),
  });
}
