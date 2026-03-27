import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(3000).nullable().optional(),
  client: z.string().max(200).nullable().optional(),
  result: z.string().max(2000).nullable().optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// 진행사례 수정
export async function PUT(req: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.caseStudy.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.caseStudy.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true, id: updated.id });
}

// 진행사례 삭제
export async function DELETE(req: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const existing = await prisma.caseStudy.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.caseStudy.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
