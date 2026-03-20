import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/campaign/api-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  role: z.enum(["ADVERTISER", "MEDIA_OWNER"]),
});

export async function POST(req: Request) {
  const authz = await requireDbUser();
  if (!authz.ok) {
    return NextResponse.json(
      { ok: false, error: authz.message },
      { status: authz.status },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "역할이 필요합니다." }, { status: 400 });
  }

  const role =
    parsed.data.role === "MEDIA_OWNER"
      ? UserRole.MEDIA_OWNER
      : UserRole.ADVERTISER;

  await prisma.user.update({
    where: { id: authz.userId },
    data: { role },
  });

  return NextResponse.json({ ok: true, role: parsed.data.role });
}
