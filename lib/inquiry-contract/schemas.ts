import { z } from "zod";

export const createInquiryContractBodySchema = z.object({
  agreedBudgetKrw: z.coerce.number().int().min(0).max(1_000_000_000_000).optional(),
  agreedPeriod: z.string().trim().max(500).optional(),
});

export const signInquiryContractBodySchema = z.object({
  signerName: z.string().trim().min(2).max(120),
});
