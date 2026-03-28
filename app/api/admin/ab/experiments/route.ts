import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { aggregateAbExperiment } from "@/lib/ab/evaluate-auto-winner";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const experiments = await prisma.abExperiment.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      trafficSplitA: true,
      winnerVariant: true,
      minImpressionsAuto: true,
      updatedAt: true,
    },
  });

  const withStats = await Promise.all(
    experiments.map(async (e) => {
      const aggregates = await aggregateAbExperiment(e.id);
      return { ...e, aggregates };
    }),
  );

  return NextResponse.json({ ok: true, experiments: withStats });
}

const createSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(200),
  trafficSplitA: z.number().int().min(0).max(100).optional(),
  minImpressionsAuto: z.number().int().min(10).max(100000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const exp = await prisma.abExperiment.create({
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        status: "DRAFT",
        trafficSplitA: parsed.data.trafficSplitA ?? 50,
        minImpressionsAuto: parsed.data.minImpressionsAuto ?? 100,
      },
    });
    return NextResponse.json({ ok: true, experiment: exp }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create failed (duplicate slug?)" }, { status: 409 });
  }
}
