import { z } from "zod";

export const campaignSaveBodySchema = z.object({
  parse: z.object({
    target: z.object({
      age_band: z.string().nullable(),
      gender: z.string().nullable(),
      lifestyle_notes: z.string().nullable(),
    }),
    audience_tags: z.array(z.string()),
    budget_krw: z.number().int().min(0),
    duration_weeks: z.number().int().min(1).max(104),
    location_keywords: z.array(z.string()),
    goal: z.string(),
    style_notes: z.string(),
    preferred_categories: z.array(z.string()),
  }),
  proposal: z.object({
    id: z.string().min(1),
    media_ids: z.array(z.string().uuid()).min(1),
    total_cost_krw: z.number().int().min(0),
    estimated_reach: z.number().int().min(0),
    breakdown: z.array(
      z.object({
        category: z.string(),
        count: z.number(),
        pct: z.number(),
      }),
    ),
    reasoning_ko: z.string().optional(),
  }),
  title: z.string().max(200).optional(),
});

export type CampaignSaveBody = z.infer<typeof campaignSaveBodySchema>;
