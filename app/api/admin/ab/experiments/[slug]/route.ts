import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "RUNNING", "STOPPED", "CONCLUDED"]).optional(),
  winnerVariant: z.enum(["A", "B"]).nullable().optional(),
  trafficSplitA: z.number().int().min(0).max(100).optional(),
  minImpressionsAuto: z.number().int().min(10).max(100000).optional(),
  name: z.string().min(1).max(200).optional(),
});

type Ctx = { params: Promise<{ slug: string }> };

export async function PATCH(req: Request, context: Ctx) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.winnerVariant !== undefined) {
    data.winnerVariant = parsed.data.winnerVariant;
  }
  if (parsed.data.trafficSplitA !== undefined) {
    data.trafficSplitA = parsed.data.trafficSplitA;
  }
  if (parsed.data.minImpressionsAuto !== undefined) {
    data.minImpressionsAuto = parsed.data.minImpressionsAuto;
  }
  if (parsed.data.name !== undefined) data.name = parsed.data.name;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  try {
    const exp = await prisma.abExperiment.update({
      where: { slug },
      data,
    });
    return NextResponse.json({ ok: true, experiment: exp });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
