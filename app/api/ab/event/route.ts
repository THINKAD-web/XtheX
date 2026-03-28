import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";
import { validateOrigin } from "@/lib/security/csrf";
import { pickAbVariant } from "@/lib/ab/pick-variant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1).max(120),
  variant: z.enum(["A", "B"]),
  type: z.enum(["IMPRESSION", "CONVERSION"]),
});

export async function POST(req: Request) {
  const rl = withRateLimit(req, { limit: 120, windowMs: 60_000 });
  if (rl) return rl;
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const subject =
    cookieStore.get("ab_sub")?.value?.trim() ?? `anon_${parsed.data.slug}`;

  const experiment = await prisma.abExperiment.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      status: true,
      trafficSplitA: true,
      winnerVariant: true,
    },
  });

  if (!experiment) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (experiment.status !== "RUNNING") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const expected = pickAbVariant(experiment, subject);
  if (expected !== parsed.data.variant) {
    return NextResponse.json({ error: "Variant mismatch" }, { status: 400 });
  }

  await prisma.abEvent.create({
    data: {
      experimentId: experiment.id,
      variant: parsed.data.variant,
      type: parsed.data.type,
      subjectKey: subject.slice(0, 200),
    },
  });

  return NextResponse.json({ ok: true });
}
