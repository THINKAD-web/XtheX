import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const putSchema = z.object({
  publicKeySpki: z.string().min(40).max(4096).nullable(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ publicKeySpki: null, demo: true });
  }
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { inquiryE2ePublicKeySpki: true },
  });
  return NextResponse.json({
    publicKeySpki: u?.inquiryE2ePublicKeySpki?.trim() ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 20, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const v = parsed.data.publicKeySpki;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      inquiryE2ePublicKeySpki: v === null ? null : v.trim(),
    },
  });

  return NextResponse.json({ ok: true });
}
