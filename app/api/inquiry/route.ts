import { NextResponse } from "next/server";
import { MediaStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    mediaId: z.string().uuid(),
    message: z.string().min(5).max(8000),
    desiredPeriod: z.string().max(200).optional(),
    budget: z.coerce.number().int().nonnegative().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(40).optional(),
    locale: z.string().max(12).optional(), // for revalidatePath convenience
  })
  .refine((v) => Boolean(v.contactEmail?.trim() || v.contactPhone?.trim()), {
    message: "Provide contactEmail or contactPhone",
    path: ["contactEmail"],
  });

export async function POST(req: Request) {
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

  const created = await prisma.inquiry.create({
    data: {
      advertiserId,
      mediaId: data.mediaId,
      message: data.message.trim(),
      desiredPeriod: data.desiredPeriod?.trim() || null,
      budget: data.budget ?? null,
      contactEmail: data.contactEmail?.trim().toLowerCase() || null,
      contactPhone: data.contactPhone?.trim() || null,
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

  return NextResponse.json({ ok: true, id: created.id });
}
