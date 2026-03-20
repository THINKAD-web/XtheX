import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/campaign/api-auth";

export const runtime = "nodejs";

export async function POST() {
  const authz = await requireDbUser();
  if (!authz.ok) {
    return NextResponse.json(
      { ok: false, error: authz.message },
      { status: authz.status },
    );
  }

  await prisma.user.update({
    where: { id: authz.userId },
    data: { onboardingCompleted: true },
  });

  return NextResponse.json({ ok: true });
}
