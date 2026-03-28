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

const PostSchema = z.object({
  applicationId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(300),
  summary: z.string().max(12000).optional(),
  documentUrl: z.string().max(2000).url().optional().or(z.literal("")),
  effectiveDate: z.string().max(40).optional().nullable(),
  endDate: z.string().max(40).optional().nullable(),
  status: z.nativeEnum(PartnershipContractStatus).optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const rows = await prisma.partnershipContract.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      application: {
        select: { id: true, companyName: true, email: true },
      },
    },
  });

  return NextResponse.json({ ok: true, contracts: rows });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
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

  const contract = await prisma.partnershipContract.create({
    data: {
      applicationId: d.applicationId ?? null,
      title: d.title,
      summary: d.summary?.trim() || null,
      documentUrl: d.documentUrl?.trim() || null,
      effectiveDate: parseOptionalDate(d.effectiveDate),
      endDate: parseOptionalDate(d.endDate),
      status: d.status ?? PartnershipContractStatus.DRAFT,
      createdById: auth.userId,
    },
    include: {
      application: {
        select: { id: true, companyName: true, email: true },
      },
    },
  });

  return NextResponse.json({ ok: true, contract });
}
