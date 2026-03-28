import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { patchAdminTodoSchema } from "@/lib/admin/workflow-schemas";

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

  const parsed = patchAdminTodoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const data: { done?: boolean; title?: string; priority?: number } = {};
  if (d.done !== undefined) data.done = d.done;
  if (d.title !== undefined) data.title = d.title;
  if (d.priority !== undefined) data.priority = d.priority;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  try {
    const row = await prisma.adminTodo.update({
      where: { id },
      data,
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
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
    await prisma.adminTodo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
