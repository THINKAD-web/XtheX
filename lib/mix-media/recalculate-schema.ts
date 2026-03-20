import { z } from "zod";
import type { MediaCategory } from "@prisma/client";
import type { NaturalLanguageMixParse } from "./types";

const MEDIA_CATEGORIES: MediaCategory[] = [
  "BILLBOARD",
  "DIGITAL_BOARD",
  "TRANSIT",
  "STREET_FURNITURE",
  "WALL",
  "ETC",
];

const schema = z.object({
  recalculate: z.literal(true),
  parse: z.object({
    target: z.object({
      age_band: z.string().nullable(),
      gender: z.string().nullable(),
      lifestyle_notes: z.string().nullable(),
    }),
    audience_tags: z.array(z.string()),
    budget_krw: z.number().int().min(500_000).max(500_000_000_000),
    duration_weeks: z.number().int().min(1).max(104),
    location_keywords: z.array(z.string()),
    goal: z.string(),
    style_notes: z.string(),
    preferred_categories: z.array(z.string()),
  }),
});

export function parseRecalculateBody(
  body: unknown,
): { ok: true; parse: NaturalLanguageMixParse } | { ok: false; error: string } {
  const r = schema.safeParse(body);
  if (!r.success) {
    return { ok: false, error: "유효하지 않은 재계산 요청입니다." };
  }
  const p = r.data.parse;
  const cats = p.preferred_categories.filter((c) =>
    MEDIA_CATEGORIES.includes(c as MediaCategory),
  ) as MediaCategory[];
  const parse: NaturalLanguageMixParse = {
    target: p.target,
    audience_tags: p.audience_tags,
    budget_krw: p.budget_krw,
    duration_weeks: p.duration_weeks,
    location_keywords: p.location_keywords,
    goal: p.goal,
    style_notes: p.style_notes,
    preferred_categories: cats.length
      ? cats
      : (["DIGITAL_BOARD", "TRANSIT"] as MediaCategory[]),
  };
  return { ok: true, parse };
}
