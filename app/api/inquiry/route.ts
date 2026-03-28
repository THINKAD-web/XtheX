import { NextResponse } from "next/server";
import { MediaStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";
import { sendInquiryConfirmation } from "@/lib/email/send-email";
import { withRateLimit } from "@/lib/security/rate-limit";
import { E2E_INQUIRY_PLACEHOLDER } from "@/lib/crypto/inquiry-e2e-constants";
import { parseInquiryE2eEnvelope } from "@/lib/crypto/inquiry-e2e-schema";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    mediaId: z.string().uuid(),
    message: z.string().max(8000),
    sensitiveEnvelope: z.string().max(120_000).optional(),
    desiredPeriod: z.string().max(200).optional(),
    budget: z.coerce.number().int().nonnegative().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(40).optional(),
    locale: z.string().max(12).optional(), // for revalidatePath convenience
  })
  .superRefine((data, ctx) => {
    if (data.sensitiveEnvelope?.trim()) {
      if (data.message !== E2E_INQUIRY_PLACEHOLDER) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid E2E message marker",
          path: ["message"],
        });
      }
      if (!parseInquiryE2eEnvelope(data.sensitiveEnvelope.trim())) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid sensitive envelope",
          path: ["sensitiveEnvelope"],
        });
      }
      if (!data.contactEmail?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "contactEmail required for E2E inquiries",
          path: ["contactEmail"],
        });
      }
    } else if (data.message.trim().length < 5) {
      ctx.addIssue({
        code: "custom",
        message: "Message too short",
        path: ["message"],
      });
    }
  })
  .refine(
    (v) => {
      if (v.sensitiveEnvelope?.trim()) return Boolean(v.contactEmail?.trim());
      return Boolean(v.contactEmail?.trim() || v.contactPhone?.trim());
    },
    {
      message: "Provide contactEmail or contactPhone",
      path: ["contactEmail"],
    },
  );

export async function POST(req: Request) {
  const rl = withRateLimit(req, { limit: 10, windowMs: 60_000 });
  if (rl) return rl;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const session = await getServerSession(authOptions);
  const advertiserId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;

  if (!advertiserId || role !== UserRole.ADVERTISER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const media = await prisma.media.findUnique({
    where: { id: data.mediaId },
    select: { id: true, status: true },
  });
  if (!media || media.status !== MediaStatus.PUBLISHED) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const e2e = Boolean(data.sensitiveEnvelope?.trim());
  const created = await prisma.inquiry.create({
    data: {
      advertiserId,
      mediaId: data.mediaId,
      message: e2e ? E2E_INQUIRY_PLACEHOLDER : data.message.trim(),
      sensitiveEnvelope: e2e ? data.sensitiveEnvelope!.trim() : null,
      e2eEncrypted: e2e,
      desiredPeriod: data.desiredPeriod?.trim() || null,
      budget: data.budget ?? null,
      contactEmail: data.contactEmail?.trim().toLowerCase() || null,
      contactPhone: e2e ? null : data.contactPhone?.trim() || null,
      status: "PENDING",
      adminMemo: null,
    },
    select: { id: true },
  });

  const locale = data.locale?.trim();
  if (locale) {
    revalidatePath(`/${locale}/explore`);
    revalidatePath(`/${locale}/dashboard/advertiser/inquiries`);
  }
  revalidatePath("/explore");
  revalidatePath("/dashboard/advertiser/inquiries");

  const contactEmail = data.contactEmail?.trim().toLowerCase();
  if (contactEmail) {
    const mediaInfo = await prisma.media.findUnique({
      where: { id: data.mediaId },
      select: { mediaName: true },
    });
    sendInquiryConfirmation({
      to: contactEmail,
      mediaTitle: mediaInfo?.mediaName ?? "매체",
      message: e2e
        ? "[E2E] Your inquiry was sent with end-to-end encryption. The media owner decrypts it in their dashboard; plaintext is not stored on our servers."
        : data.message.trim(),
      inquiryId: created.id,
    }).catch((err) => console.error("[inquiry] email send failed:", err));
  }

  return NextResponse.json({ ok: true, id: created.id });
}
