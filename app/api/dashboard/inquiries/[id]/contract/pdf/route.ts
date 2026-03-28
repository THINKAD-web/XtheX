import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { buildInquiryContractPdf } from "@/lib/inquiry-contract/build-pdf";
import {
  assertInquiryContractParty,
  loadInquiryForContractApi,
} from "@/lib/inquiry-contract/access";
import { getAuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

function uuidOk(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  const userId = session?.user?.id?.trim();
  const role = session?.user?.role as UserRole | undefined;
  if (!userId || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: inquiryId } = await ctx.params;
  if (!uuidOk(inquiryId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const inquiry = await loadInquiryForContractApi(inquiryId);
  if (!inquiry?.contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = assertInquiryContractParty(inquiry, userId, role);
  if (!gate.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const c = inquiry.contract;
  const buf = buildInquiryContractPdf({
    contractId: c.id,
    mediaName: inquiry.media.mediaName,
    advertiserEmail: inquiry.advertiser.email,
    mediaOwnerEmail: inquiry.media.createdBy?.email ?? null,
    agreedBudgetKrw: c.agreedBudgetKrw,
    agreedPeriod: c.agreedPeriod,
    status: c.status,
    advertiserSignName: c.advertiserSignName,
    advertiserSignedAtIso: c.advertiserSignedAt?.toISOString() ?? null,
    mediaOwnerSignName: c.mediaOwnerSignName,
    mediaOwnerSignedAtIso: c.mediaOwnerSignedAt?.toISOString() ?? null,
  });

  const filename = `xthex-contract-${c.id.slice(0, 8)}.pdf`;
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
