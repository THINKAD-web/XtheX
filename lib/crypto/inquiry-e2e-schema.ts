import { z } from "zod";

export const inquiryE2eEnvelopeSchema = z.object({
  v: z.literal(1),
  wrappedKey: z.string().min(32).max(2048),
  iv: z.string().min(8).max(64),
  ciphertext: z.string().min(16).max(200_000),
});

export type InquiryE2eEnvelopeV1 = z.infer<typeof inquiryE2eEnvelopeSchema>;

export function parseInquiryE2eEnvelope(json: string): InquiryE2eEnvelopeV1 | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    return null;
  }
  const r = inquiryE2eEnvelopeSchema.safeParse(raw);
  return r.success ? r.data : null;
}
