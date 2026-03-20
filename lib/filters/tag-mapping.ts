import { prisma } from "@/lib/prisma";

export type TagMapping = {
  code: string;
  mappingField: string;
  mappingType: string;
  mappingValue?: string | null;
};

export async function loadTagMappings(
  tagCodes: string[],
): Promise<Record<string, TagMapping>> {
  if (tagCodes.length === 0) return {};

  const tags = await prisma.tag.findMany({
    where: { code: { in: tagCodes } },
    select: {
      code: true,
      mappingField: true,
      mappingType: true,
      mappingValue: true,
    },
  });

  const map: Record<string, TagMapping> = {};
  for (const t of tags) {
    map[t.code] = {
      code: t.code,
      mappingField: t.mappingField,
      mappingType: t.mappingType,
      mappingValue: t.mappingValue,
    };
  }
  return map;
}

