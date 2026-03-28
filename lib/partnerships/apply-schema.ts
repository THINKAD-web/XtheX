import { PartnershipType } from "@prisma/client";
import { z } from "zod";

export const partnershipApplySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(500).url().optional().or(z.literal("")),
  type: z.nativeEnum(PartnershipType),
  message: z.string().trim().min(10).max(8000),
});

export type PartnershipApplyInput = z.infer<typeof partnershipApplySchema>;
