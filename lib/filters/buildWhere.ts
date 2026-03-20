import type { Prisma } from "@prisma/client";
import { AdvancedFilterSchema } from "./schema";
import { loadTagMappings } from "./tag-mapping";

type MediaWhere = Prisma.MediaWhereInput;

function buildConditionFromTag(
  mapping: {
    mappingField: string;
    mappingType: string;
    mappingValue?: string | null;
  },
  /** Advanced-tag code (e.g. morning_rush); used when DB has no dedicated column */
  tagCode: string,
): MediaWhere {
  const value = mapping.mappingValue ?? "";

  switch (mapping.mappingField) {
    case "location.district":
      // Prisma JSON path filter causes "column (not available)" on PostgreSQL; skip until filterJson/raw
      break;

    case "location.poi":
      // Prisma JSON path filter causes "column (not available)" on PostgreSQL; skip until filterJson/raw
      break;

    case "timeSlot":
      return {
        tags: { has: tagCode },
      };

    case "targetAudience":
      return {
        targetAudience: { contains: value },
      };

    case "targetSegment":
      return {
        tags: { has: value },
      };

    default:
      return {};
  }

  return {};
}

export async function buildWhereFromJson(json: unknown): Promise<MediaWhere> {
  const parsed = AdvancedFilterSchema.safeParse(
    json === null || json === undefined ? { groups: [] } : json,
  );
  if (!parsed.success) {
    throw new Error("Invalid advanced filter JSON");
  }
  const filter = parsed.data;

  const allTagCodes = Array.from(new Set(filter.groups.flatMap((g) => g.tags)));
  const mappingMap = await loadTagMappings(allTagCodes);

  const andGroups: MediaWhere[] = [];

  for (const group of filter.groups) {
    const conditions: MediaWhere[] = [];

    for (const code of group.tags) {
      const m = mappingMap[code];
      if (!m) continue;
      const cond = buildConditionFromTag(m, code);
      if (Object.keys(cond).length > 0) conditions.push(cond);
    }

    if (conditions.length === 0) continue;

    if (group.logic === "AND") {
      andGroups.push({ AND: conditions });
    } else {
      andGroups.push({ OR: conditions });
    }
  }

  if (andGroups.length === 0) return {};
  if (andGroups.length === 1) return andGroups[0];

  return { AND: andGroups };
}

