import { NextResponse } from "next/server";
import { PartnershipContractStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/partnerships/admin-guard";

export const runtime = "nodejs";

function parseOptionalDate(raw: string | null | undefined): Date | null {
  if (raw == null || !String(raw).trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

const PatchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  summary: z.string().max(12000).optional().nullable(),
  documentUrl: z.string().max(2000).url().optional().or(z.literal("")).nullable(),
  effectiveDate: z.string().max(40).optional().nullable(),
  endDate: z.string().max(40).optional().nullable(),
  status: z.nativeEnum(PartnershipContractStatus).optional(),
  applicationId: z.string().uuid().optional().nullable(),
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

  const existing = await prisma.partnershipContract.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const d = parsed.data;
  if (d.applicationId) {
    const app = await prisma.partnershipApplication.findUnique({
      where: { id: d.applicationId },
      select: { id: true },
    });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 400 });
    }
  }

  const updated = await prisma.partnershipContract.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.summary !== undefined ? { summary: d.summary?.trim() || null } : {}),
      ...(d.documentUrl !== undefined
        ? { documentUrl: d.documentUrl?.trim() || null }
        : {}),
      ...(d.effectiveDate !== undefined
        ? { effectiveDate: parseOptionalDate(d.effectiveDate) }
        : {}),
      ...(d.endDate !== undefined ? { endDate: parseOptionalDate(d.endDate) } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.applicationId !== undefined ? { applicationId: d.applicationId } : {}),
    },
    include: {
      application: {
        select: { id: true, companyName: true, email: true },
      },
    },
  });

  return NextResponse.json({ ok: true, contract: updated });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await prisma.partnershipContract.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
