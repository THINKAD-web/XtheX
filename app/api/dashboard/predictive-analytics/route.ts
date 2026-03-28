import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { buildPredictiveAnalytics } from "@/lib/predictive/build-predictive-analytics";

export const runtime = "nodejs";

const LOCALES = ["ko", "en", "ja", "zh", "es"] as const;

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role === UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = new URL(req.url).searchParams.get("locale")?.trim().toLowerCase() ?? "";
  const locale = LOCALES.includes(raw as (typeof LOCALES)[number]) ? raw : "ko";

  const data = await buildPredictiveAnalytics(session.user.id, locale);
  return NextResponse.json({ ok: true, data });
}
