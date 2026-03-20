import { z } from "zod";

const uuid = z.string().uuid();

export const omniCartItemSchema = z.object({
  id: uuid,
  mediaName: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  priceMin: z.number().int().min(0).nullable().optional(),
  priceMax: z.number().int().min(0).nullable().optional(),
  source: z.enum(["explore", "mix"]).optional(),
});

export const omniSubmitBodySchema = z.object({
  title: z.string().max(200).optional(),
  items: z.array(omniCartItemSchema).min(1).max(200),
  budget_krw: z.number().int().min(0).optional(),
  duration_weeks: z.number().int().min(1).max(104).optional(),
});

export type OmniSubmitBody = z.infer<typeof omniSubmitBodySchema>;
