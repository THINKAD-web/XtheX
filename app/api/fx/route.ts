import { NextResponse } from "next/server";
import {
  FX_TO_KRW_MOCK,
  type SupportedCurrency,
} from "@/lib/currency";

export const runtime = "nodejs";

/**
 * Live KRW-per-unit rates (1 unit of USD/EUR/JPY → KRW) via Frankfurter.
 * UI still uses client-side mock by default; consume this endpoint when wiring real FX.
 */
export async function GET() {
  const fallback = { ...FX_TO_KRW_MOCK } as Record<SupportedCurrency, number>;
  try {
    const [usd, eur, jpy] = await Promise.all([
      fetch("https://api.frankfurter.app/latest?from=USD&to=KRW", {
        next: { revalidate: 3600 },
      }).then((r) => r.json() as Promise<{ rates?: { KRW?: number } }>),
      fetch("https://api.frankfurter.app/latest?from=EUR&to=KRW", {
        next: { revalidate: 3600 },
      }).then((r) => r.json() as Promise<{ rates?: { KRW?: number } }>),
      fetch("https://api.frankfurter.app/latest?from=JPY&to=KRW", {
        next: { revalidate: 3600 },
      }).then((r) => r.json() as Promise<{ rates?: { KRW?: number } }>),
    ]);
    const rates: Record<SupportedCurrency, number> = {
      KRW: 1,
      USD: typeof usd.rates?.KRW === "number" ? usd.rates.KRW : fallback.USD,
      EUR: typeof eur.rates?.KRW === "number" ? eur.rates.KRW : fallback.EUR,
      JPY: typeof jpy.rates?.KRW === "number" ? jpy.rates.KRW : fallback.JPY,
    };
    return NextResponse.json({ ok: true, source: "frankfurter", rates });
  } catch {
    return NextResponse.json({ ok: true, source: "mock", rates: fallback });
  }
}
