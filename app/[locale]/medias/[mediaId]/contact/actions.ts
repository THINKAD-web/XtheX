"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { UserRole, MediaStatus } from "@prisma/client";

const inquirySchema = z.object({
  mediaId: z.string().uuid(),
  locale: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  desiredPeriod: z.string().optional(),
  budget: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number.parseInt(v, 10) : undefined))
    .pipe(z.number().int().nonnegative().optional()),
  message: z.string().min(5),
});

export async function submitInquiry(formData: FormData) {
  const raw = {
    mediaId: String(formData.get("mediaId") || ""),
    locale: String(formData.get("locale") || "ko"),
    email: formData.get("email") ? String(formData.get("email")) : undefined,
    phone: formData.get("phone") ? String(formData.get("phone")) : undefined,
    desiredPeriod: formData.get("desiredPeriod")
      ? String(formData.get("desiredPeriod"))
      : undefined,
    budget: formData.get("budget") ? String(formData.get("budget")) : undefined,
    message: String(formData.get("message") || ""),
  };

  const parsed = inquirySchema.safeParse(raw);
  const fallbackLocale = raw.locale || "ko";
  const fallbackMediaId = raw.mediaId || "";

  if (!parsed.success) {
    return redirect(
      `/${fallbackLocale}/medias/${fallbackMediaId}?inquiry=error`,
    );
  }

  const data = parsed.data;

  const session = await getServerSession(authOptions);
  const advertiserId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!advertiserId || role !== UserRole.ADVERTISER) {
    return redirect(`/${data.locale}/login?callbackUrl=/medias/${data.mediaId}`);
  }

  const media = await prisma.media.findUnique({
    where: { id: data.mediaId },
    select: { id: true, status: true },
  });
  if (!media || media.status !== MediaStatus.PUBLISHED) {
    return redirect(`/${data.locale}/medias/${data.mediaId}?inquiry=error`);
  }

  await prisma.inquiry.create({
    data: {
      advertiserId,
      mediaId: data.mediaId,
      message: data.message,
      desiredPeriod: data.desiredPeriod?.trim() || null,
      budget: data.budget ?? null,
      contactEmail: data.email?.trim().toLowerCase() || null,
      contactPhone: data.phone?.trim() || null,
      status: "PENDING",
      adminMemo: null,
    },
  });

  return redirect(
    `/${data.locale}/medias/${data.mediaId}?inquiry=ok`,
  );
}

