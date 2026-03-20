"use server";

import { prisma } from "@/lib/prisma";
import { buildWhereFromJson } from "@/lib/filters/buildWhere";
import { AdvancedFilterSchema } from "@/lib/filters/schema";
import { auth } from "@clerk/nextjs/server";

async function prismaUserIdFromClerk(): Promise<string | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const u = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  return u?.id ?? null;
}

export async function searchMediasWithAdvancedFilter(filterJson: unknown) {
  const where = await buildWhereFromJson(filterJson);

  const medias = await prisma.media.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      createdBy: { select: { email: true, name: true } },
    },
  });

  return medias;
}

export async function listFilterPresets() {
  const ownerDbId = await prismaUserIdFromClerk();

  const presets = await prisma.savedFilterPreset.findMany({
    orderBy: { createdAt: "desc" },
    where:
      ownerDbId != null
        ? { OR: [{ ownerId: null }, { ownerId: ownerDbId }] }
        : { ownerId: null },
    take: 50,
  });

  return presets.map((p) => ({
    id: p.id,
    nameKo: p.nameKo,
    nameEn: p.nameEn,
    filterJson: p.filterJson,
    isGlobal: p.ownerId === null,
  }));
}

export async function saveFilterPreset(
  nameKo: string,
  nameEn: string,
  filterJson: unknown,
) {
  const ownerDbId = await prismaUserIdFromClerk();

  const parsed = AdvancedFilterSchema.safeParse(filterJson);
  if (!parsed.success) {
    throw new Error("필터 구조가 올바르지 않습니다.");
  }

  const preset = await prisma.savedFilterPreset.create({
    data: {
      nameKo: nameKo || nameEn || "새 프리셋",
      nameEn: nameEn || nameKo || "New preset",
      filterJson: parsed.data,
      ownerId: ownerDbId,
    },
  });

  return {
    id: preset.id,
    nameKo: preset.nameKo,
    nameEn: preset.nameEn,
    filterJson: preset.filterJson,
    isGlobal: preset.ownerId === null,
  };
}


