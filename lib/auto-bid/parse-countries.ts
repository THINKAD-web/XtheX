import { z } from "zod";

const CodeSchema = z.string().trim().length(2).transform((s) => s.toUpperCase());

/** 빈 배열이면 전체 국가 */
export function parseCountryCodesJson(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    const p = CodeSchema.safeParse(String(x));
    if (p.success) out.push(p.data);
  }
  return [...new Set(out)];
}
