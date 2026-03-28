import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ devices: [] });
  }
  const devices = await prisma.loginDevice.findMany({
    where: { userId: session.user.id },
    orderBy: { lastSeenAt: "desc" },
  });
  return NextResponse.json({ devices });
}

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const body = (await req.json()) as { deviceKey?: string; nickname?: string };
  const deviceKey = typeof body.deviceKey === "string" ? body.deviceKey.trim() : "";
  if (!deviceKey || deviceKey.length < 8) {
    return NextResponse.json({ error: "Invalid device key" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const ip = clientIp(req);

  await prisma.loginDevice.upsert({
    where: {
      userId_deviceKey: { userId: session.user.id, deviceKey },
    },
    create: {
      userId: session.user.id,
      deviceKey,
      nickname: typeof body.nickname === "string" ? body.nickname.slice(0, 80) : null,
      userAgent: ua,
      ipLast: ip,
    },
    update: {
      nickname:
        typeof body.nickname === "string" ? body.nickname.slice(0, 80) : undefined,
      userAgent: ua ?? undefined,
      ipLast: ip ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
