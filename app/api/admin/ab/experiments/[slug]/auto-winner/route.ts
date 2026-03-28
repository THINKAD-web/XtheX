import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { evaluateAndApplyAbWinner } from "@/lib/ab/evaluate-auto-winner";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(_req: Request, context: Ctx) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug);

  const experiment = await prisma.abExperiment.findUnique({
    where: { slug },
    select: { id: true, status: true, minImpressionsAuto: true },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (experiment.status !== "RUNNING") {
    return NextResponse.json(
      { error: "Experiment must be RUNNING", status: experiment.status },
      { status: 409 },
    );
  }

  const result = await evaluateAndApplyAbWinner(
    experiment.id,
    experiment.minImpressionsAuto,
  );

  return NextResponse.json({ ok: true, result });
}
