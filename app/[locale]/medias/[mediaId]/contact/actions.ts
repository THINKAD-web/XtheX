"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

const inquirySchema = z.object({
  mediaId: z.string().uuid(),
  locale: z.string().min(2),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  budget: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number.parseInt(v, 10) : undefined))
    .pipe(z.number().int().nonnegative().optional()),
  message: z.string().min(1),
});

export async function submitInquiry(formData: FormData) {
  const raw = {
    mediaId: String(formData.get("mediaId") || ""),
    locale: String(formData.get("locale") || "ko"),
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    company: formData.get("company") ? String(formData.get("company")) : undefined,
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

  await prisma.inquiry.create({
    data: {
      mediaId: data.mediaId,
      name: data.name,
      email: data.email,
      company: data.company,
      budget: data.budget,
      message: data.message,
      locale: data.locale,
    },
  });

  return redirect(
    `/${data.locale}/medias/${data.mediaId}?inquiry=ok`,
  );
}

