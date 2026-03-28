import { NextResponse } from "next/server";
import {
  InquiryContractStatus,
  InquiryStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import {
  assertInquiryContractParty,
  loadInquiryForContractApi,
} from "@/lib/inquiry-contract/access";
import {
  createInquiryContractBodySchema,
  signInquiryContractBodySchema,
} from "@/lib/inquiry-contract/schemas";

export const runtime = "nodejs";

function uuidOk(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

function locLabel(locationJson: unknown): string {
  if (
    typeof locationJson === "object" &&
    locationJson != null &&
    "address" in locationJson &&
    typeof (locationJson as { address?: unknown }).address === "string"
  ) {
    return String((locationJson as { address: string }).address);
  }
  return "—";
}

function serializeContractRow(
  row: NonNullable<
    Awaited<ReturnType<typeof loadInquiryForContractApi>>
  >["contract"],
) {
  if (!row) return null;
  return {
    id: row.id,
    inquiryId: row.inquiryId,
    agreedBudgetKrw: row.agreedBudgetKrw,
    agreedPeriod: row.agreedPeriod,
    status: row.status,
    advertiserSignName: row.advertiserSignName,
    advertiserSignedAt: row.advertiserSignedAt?.toISOString() ?? null,
    mediaOwnerSignName: row.mediaOwnerSignName,
    mediaOwnerSignedAt: row.mediaOwnerSignedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = assertInquiryContractParty(inquiry, userId, role);
  if (!gate.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    contract: serializeContractRow(inquiry.contract),
    inquiry: {
      id: inquiry.id,
      status: inquiry.status,
      message: inquiry.message,
      budget: inquiry.budget,
      desiredPeriod: inquiry.desiredPeriod,
      contactEmail: inquiry.contactEmail,
      contactPhone: inquiry.contactPhone,
      createdAt: inquiry.createdAt.toISOString(),
    },
    media: {
      id: inquiry.media.id,
      name: inquiry.media.mediaName,
      type: String(inquiry.media.category),
      weeklyPriceKrw: inquiry.media.price ?? null,
      locationLabel: locLabel(inquiry.media.locationJson),
    },
    advertiserEmail: inquiry.advertiser.email,
    mediaOwnerEmail: inquiry.media.createdBy?.email ?? null,
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  const userId = session?.user?.id?.trim();
  const role = session?.user?.role as UserRole | undefined;
  if (!userId || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== UserRole.ADVERTISER && role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: inquiryId } = await ctx.params;
  if (!uuidOk(inquiryId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createInquiryContractBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const inquiry = await loadInquiryForContractApi(inquiryId);
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (role === UserRole.ADVERTISER && inquiry.advertiserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (inquiry.contract) {
    return NextResponse.json({ error: "Contract already exists" }, { status: 409 });
  }

  if (inquiry.status === InquiryStatus.CLOSED) {
    return NextResponse.json({ error: "Inquiry closed" }, { status: 400 });
  }

  const d = parsed.data;
  const agreedBudgetKrw =
    d.agreedBudgetKrw !== undefined ? d.agreedBudgetKrw : inquiry.budget;
  const agreedPeriod =
    d.agreedPeriod !== undefined && d.agreedPeriod.length > 0
      ? d.agreedPeriod
      : (inquiry.desiredPeriod ?? null);

  const created = await prisma.inquiryContract.create({
    data: {
      inquiryId: inquiry.id,
      agreedBudgetKrw,
      agreedPeriod,
      status: InquiryContractStatus.DRAFT,
    },
  });

  const full = await loadInquiryForContractApi(inquiryId);
  return NextResponse.json({
    ok: true,
    contract: serializeContractRow(full!.contract),
  });
}

export async function PATCH(
  req: Request,
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signInquiryContractBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const inquiry = await loadInquiryForContractApi(inquiryId);
  if (!inquiry?.contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = assertInquiryContractParty(inquiry, userId, role);
  if (!gate.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (gate.isAdmin) {
    return NextResponse.json({ error: "Admin cannot sign" }, { status: 403 });
  }

  const name = parsed.data.signerName;
  const now = new Date();
  const c = inquiry.contract;

  if (gate.isAdvertiser) {
    if (c.status !== InquiryContractStatus.DRAFT || c.advertiserSignedAt) {
      return NextResponse.json({ error: "Invalid contract state" }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.inquiryContract.update({
        where: { id: c.id },
        data: {
          advertiserSignName: name,
          advertiserSignedAt: now,
          status: InquiryContractStatus.AWAITING_MEDIA_OWNER,
        },
      });
      return row;
    });
    return NextResponse.json({ ok: true, contract: serializeContractRow(updated) });
  }

  if (gate.isMediaOwner) {
    if (
      c.status !== InquiryContractStatus.AWAITING_MEDIA_OWNER ||
      c.mediaOwnerSignedAt
    ) {
      return NextResponse.json({ error: "Invalid contract state" }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.inquiryContract.update({
        where: { id: c.id },
        data: {
          mediaOwnerSignName: name,
          mediaOwnerSignedAt: now,
          status: InquiryContractStatus.COMPLETED,
        },
      });
      await tx.inquiry.update({
        where: { id: inquiry.id },
        data: { status: InquiryStatus.REPLIED },
      });
      return row;
    });
    return NextResponse.json({ ok: true, contract: serializeContractRow(updated) });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
