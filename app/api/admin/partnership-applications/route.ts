import { NextResponse } from "next/server";
import { PartnershipApplicationStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/partnerships/admin-guard";

export const runtime = "nodejs";

const QuerySchema = z.object({
  status: z.nativeEnum(PartnershipApplicationStatus).optional(),
});

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = QuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
  });
  const status = q.success && q.data.status ? q.data.status : undefined;

  const rows = await prisma.partnershipApplication.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      companyName: true,
      contactName: true,
      email: true,
      phone: true,
      website: true,
      type: true,
      message: true,
      status: true,
      adminMemo: true,
      reviewedAt: true,
      reviewedById: true,
      submitterUserId: true,
    },
  });

  return NextResponse.json({ ok: true, applications: rows });
}
