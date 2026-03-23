import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/campaign/api-auth";
import { revalidateCampaignListPages } from "@/lib/campaign/revalidate-campaign-lists";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(1).max(200),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const authz = await requireDbUser();
  if (!authz.ok) {
    return NextResponse.json(
      { ok: false, error: authz.message },
      { status: authz.status },
    );
  }
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "제목이 필요합니다." }, { status: 400 });
  }

  const updated = await prisma.campaign.updateMany({
    where: { id, userId: authz.userId },
    data: { title: parsed.data.title.trim() },
  });
  if (updated.count === 0) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const authz = await requireDbUser();
  if (!authz.ok) {
    return NextResponse.json(
      { ok: false, error: authz.message },
      { status: authz.status },
    );
  }
  const { id } = await ctx.params;
  const del = await prisma.campaign.deleteMany({
    where: { id, userId: authz.userId },
  });
  if (del.count === 0) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  revalidateCampaignListPages();
  return NextResponse.json({ ok: true });
}
