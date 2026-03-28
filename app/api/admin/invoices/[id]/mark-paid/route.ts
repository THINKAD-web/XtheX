import { NextResponse } from "next/server";
import { CampaignInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";

export const runtime = "nodejs";

function uuidOk(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!uuidOk(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const now = new Date();
  try {
    const row = await prisma.campaignInvoice.update({
      where: { id },
      data: {
        status: CampaignInvoiceStatus.PAID,
        paidAt: now,
      },
      select: {
        id: true,
        status: true,
        paidAt: true,
        amountKrw: true,
      },
    });
    return NextResponse.json({
      ok: true,
      invoice: {
        ...row,
        paidAt: row.paidAt!.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
