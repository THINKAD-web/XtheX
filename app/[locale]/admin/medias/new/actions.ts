"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { MediaCategory, MediaStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createMediaAction(data: {
  mediaName: string;
  category: string;
  description?: string;
  address: string;
  district?: string;
  lat?: number;
  lng?: number;
  price?: number;
  cpm?: number;
  dailyTraffic?: string;
  monthlyImpressions?: string;
  images: string[];
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) throw new Error("Forbidden");

  const existing = await prisma.media.findFirst({
    where: { mediaName: data.mediaName },
  });
  if (existing) throw new Error("DUPLICATE_MEDIA_NAME");

  const price =
    data.price != null && Number.isFinite(data.price)
      ? Math.round(data.price)
      : null;
  const cpm =
    data.cpm != null && Number.isFinite(data.cpm) ? Math.round(data.cpm) : null;

  const media = await prisma.media.create({
    data: {
      mediaName: data.mediaName,
      category: data.category as MediaCategory,
      description: data.description || null,
      locationJson: {
        address: data.address,
        district: data.district || undefined,
        lat: data.lat,
        lng: data.lng,
      },
      price,
      cpm,
      exposureJson: {
        daily_traffic: data.dailyTraffic || undefined,
        monthly_impressions: data.monthlyImpressions || undefined,
      },
      images: data.images.filter(Boolean),
      status: MediaStatus.PENDING,
      createdById: user.id,
    },
  });

  revalidatePath("/admin/medias");
  revalidatePath("/explore");
  return { id: media.id };
}
