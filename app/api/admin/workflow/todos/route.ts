import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAdminTodoSchema } from "@/lib/admin/workflow-schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAdminTodoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const row = await prisma.adminTodo.create({
    data: {
      title: d.title,
      body: d.body?.trim() || null,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      priority: d.priority ?? 0,
      assigneeId: d.assigneeId ?? null,
      createdById: auth.userId,
    },
    include: {
      assignee: { select: { email: true } },
      createdBy: { select: { email: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    todo: {
      id: row.id,
      title: row.title,
      body: row.body,
      done: row.done,
      priority: row.priority,
      dueAt: row.dueAt?.toISOString() ?? null,
      assigneeEmail: row.assignee?.email ?? null,
      createdByEmail: row.createdBy.email,
    },
  });
}
