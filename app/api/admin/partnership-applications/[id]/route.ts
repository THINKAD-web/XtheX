import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/partnerships/admin-guard";

export const runtime = "nodejs";

const PatchSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminMemo: z.string().max(4000).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.partnershipApplication.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.partnershipApplication.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminMemo: parsed.data.adminMemo?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: auth.userId,
    },
    select: {
      id: true,
      status: true,
      adminMemo: true,
      reviewedAt: true,
      reviewedById: true,
    },
  });

  return NextResponse.json({ ok: true, application: updated });
}
