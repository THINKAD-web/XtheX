import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createBroadcastSchema } from "@/lib/admin/workflow-schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!auth.userId) {
    return NextResponse.json(
      { error: "This action requires a signed-in admin session" },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createBroadcastSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const startAt = new Date(d.startAt);
  const endAt = new Date(d.endAt);
  if (endAt <= startAt) {
    return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
  }

  const row = await prisma.broadcastSchedule.create({
    data: {
      title: d.title,
      startAt,
      endAt,
      notes: d.notes?.trim() || null,
      campaignId: d.campaignId ?? null,
      mediaId: d.mediaId ?? null,
      createdById: auth.userId,
    },
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
