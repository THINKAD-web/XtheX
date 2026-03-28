import { AutoBidRuleStatus } from "@prisma/client";
import { z } from "zod";

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "invalid_date");

export const createAutoBidRuleSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    maxBudgetKrw: z.coerce.number().int().min(1).max(1_000_000_000_000),
    countryCodes: z.array(z.string().trim().min(2).max(2)).max(80).optional(),
    periodStart: isoDate,
    periodEnd: isoDate,
    status: z.nativeEnum(AutoBidRuleStatus).optional(),
    messageTemplate: z.string().min(10).max(8000),
    maxInquiriesPerRun: z.coerce.number().int().min(1).max(20).optional(),
    minHoursBetweenRuns: z.coerce.number().int().min(1).max(168).optional(),
  })
  .refine((d) => new Date(d.periodEnd) > new Date(d.periodStart), {
    message: "period_order",
    path: ["periodEnd"],
  });

/** PATCH body: all fields optional; cannot use .partial() on refined schemas in Zod 3. */
export const patchAutoBidRuleSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    maxBudgetKrw: z.coerce.number().int().min(1).max(1_000_000_000_000).optional(),
    countryCodes: z.array(z.string().trim().min(2).max(2)).max(80).optional(),
    periodStart: isoDate.optional(),
    periodEnd: isoDate.optional(),
    status: z.nativeEnum(AutoBidRuleStatus).optional(),
    messageTemplate: z.string().min(10).max(8000).optional(),
    maxInquiriesPerRun: z.coerce.number().int().min(1).max(20).optional(),
    minHoursBetweenRuns: z.coerce.number().int().min(1).max(168).optional(),
  })
  .refine(
    (d) => {
      if (d.periodStart !== undefined && d.periodEnd !== undefined) {
        return new Date(d.periodEnd) > new Date(d.periodStart);
      }
      return true;
    },
    { message: "period_order", path: ["periodEnd"] },
  );
