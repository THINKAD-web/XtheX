import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { getCampaignAnalytics } from "@/lib/campaign/campaign-analytics";

export const runtime = "nodejs";

const MAX_RANGE_DAYS = 366;

function parseYmd(s: string | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

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

  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") ?? "all").trim() || "all";
  const mediaIdRaw = searchParams.get("mediaId")?.trim();
  const mediaId =
    mediaIdRaw && /^[0-9a-f-]{36}$/i.test(mediaIdRaw) ? mediaIdRaw : null;

  const preset = searchParams.get("preset");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let from: Date;
  let to: Date = today;

  if (preset === "7" || preset === "30" || preset === "90") {
    const days = parseInt(preset, 10);
    from = new Date(today);
    from.setDate(from.getDate() - (days - 1));
  } else {
    const fromQ = parseYmd(searchParams.get("from"));
    const toQ = parseYmd(searchParams.get("to"));
    if (!fromQ || !toQ) {
      from = new Date(today);
      from.setDate(from.getDate() - 29);
    } else {
      from = new Date(fromQ.getFullYear(), fromQ.getMonth(), fromQ.getDate());
      to = new Date(toQ.getFullYear(), toQ.getMonth(), toQ.getDate());
    }
  }

  const spanMs = to.getTime() - from.getTime();
  const spanDays = spanMs / (24 * 60 * 60 * 1000) + 1;
  if (spanDays > MAX_RANGE_DAYS || spanDays < 1) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const data = await getCampaignAnalytics({
    userId: session.user.id,
    from,
    to,
    region,
    mediaId,
  });

  return NextResponse.json({ ok: true, ...data });
}
