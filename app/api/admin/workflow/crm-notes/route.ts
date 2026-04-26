import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createCrmNoteSchema } from "@/lib/admin/workflow-schemas";

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

  const parsed = createCrmNoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const row = await prisma.adminCrmNote.create({
    data: {
      entityType: d.entityType,
      entityId: d.entityId,
      body: d.body,
      createdById: auth.userId,
    },
    include: { createdBy: { select: { email: true } } },
  });

  return NextResponse.json({
    ok: true,
    note: {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      authorEmail: row.createdBy.email,
    },
  });
}
