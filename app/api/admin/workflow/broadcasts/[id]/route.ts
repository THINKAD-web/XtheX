import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createBroadcastSchema } from "@/lib/admin/workflow-schemas";

export const runtime = "nodejs";

function uuidOk(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!uuidOk(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await prisma.broadcastSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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

  const parsed = createBroadcastSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const data: {
    title?: string;
    notes?: string | null;
    startAt?: Date;
    endAt?: Date;
    campaignId?: string | null;
    mediaId?: string | null;
  } = {};

  if (d.title !== undefined) data.title = d.title;
  if (d.notes !== undefined) data.notes = d.notes?.trim() || null;
  if (d.campaignId !== undefined) data.campaignId = d.campaignId;
  if (d.mediaId !== undefined) data.mediaId = d.mediaId;
  if (d.startAt !== undefined) data.startAt = new Date(d.startAt);
  if (d.endAt !== undefined) data.endAt = new Date(d.endAt);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const existing = await prisma.broadcastSchedule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const startAt = data.startAt ?? existing.startAt;
  const endAt = data.endAt ?? existing.endAt;
  if (endAt <= startAt) {
    return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
  }

  const row = await prisma.broadcastSchedule.update({
    where: { id },
    data: { ...data, startAt, endAt },
  });

  return NextResponse.json({
    ok: true,
    schedule: {
      id: row.id,
      title: row.title,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
    },
  });
}
