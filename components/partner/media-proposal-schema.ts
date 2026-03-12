import { z } from "zod";

export const mediaTypeValues = ["BILLBOARD", "DIGITAL", "TRANSIT", "OTHER"] as const;

const coerceNonNegativeInt = z.preprocess(
  (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? 0 : Number(v)),
  z.number().int().min(0),
);

/** Translation keys for dashboard.partner.errors – resolve in UI with useTranslations('dashboard.partner') */
export const PROPOSAL_ERROR_KEYS = {
  title_min: "errors.title_min",
  description_min: "errors.description_min",
  address_required: "errors.address_required",
  images_min: "errors.images_min",
  price_max_gte_min: "errors.price_max_gte_min",
} as const;

export const mediaProposalSchema = z
  .object({
    title: z.string().min(2, PROPOSAL_ERROR_KEYS.title_min),
    description: z.string().min(10, PROPOSAL_ERROR_KEYS.description_min),
    location: z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      address: z.string().min(2, PROPOSAL_ERROR_KEYS.address_required),
    }),
    mediaType: z.enum(mediaTypeValues),
    size: z.string().optional(),
    priceMin: coerceNonNegativeInt,
    priceMax: coerceNonNegativeInt,
    imageUrls: z.array(z.string().url()).min(1, PROPOSAL_ERROR_KEYS.images_min),
  })
  .refine((v) => v.priceMax >= v.priceMin, {
    message: PROPOSAL_ERROR_KEYS.price_max_gte_min,
    path: ["priceMax"],
  });

export type MediaProposalFormValues = z.infer<typeof mediaProposalSchema>;

