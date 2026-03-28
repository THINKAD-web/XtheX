import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

/** Toggle email OTP channel flag without new verification (user can disable here). */
export async function PUT(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { emailOtpEnabled?: boolean };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailOtpEnabled: Boolean(body.emailOtpEnabled) },
  });
  return NextResponse.json({ ok: true });
}
