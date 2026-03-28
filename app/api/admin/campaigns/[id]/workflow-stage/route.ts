import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { patchWorkflowStageSchema } from "@/lib/admin/workflow-schemas";

export const runtime = "nodejs";

function uuidOk(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!uuidOk(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchWorkflowStageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.campaign.update({
      where: { id },
      data: { workflowStage: parsed.data.workflowStage },
      select: { id: true, workflowStage: true },
    });
    return NextResponse.json({ ok: true, campaign: row });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
