import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";
import { partnershipApplySchema } from "@/lib/partnerships/apply-schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rl = withRateLimit(req, { limit: 5, windowMs: 60_000 });
  if (rl) return rl;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = partnershipApplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const website = data.website?.trim() || null;

  const session = await getServerSession(authOptions);
  const submitterUserId = session?.user?.id?.trim() || null;

  await prisma.partnershipApplication.create({
    data: {
      companyName: data.companyName.trim(),
      contactName: data.contactName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      website,
      type: data.type,
      message: data.message.trim(),
      submitterUserId,
    },
  });

  return NextResponse.json({ ok: true });
}
