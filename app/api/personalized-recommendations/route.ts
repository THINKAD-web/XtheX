import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth/session";
import { computePersonalizedRecommendations } from "@/lib/recommend/personalized-engine";
import type { ExploreSearchSignal } from "@/lib/recommend/explore-search-signals";

export const runtime = "nodejs";

const bodySchema = z.object({
  locale: z.string().optional(),
  searchSignals: z
    .array(
      z.object({
        q: z.string().optional(),
        district: z.string().optional(),
        mediaType: z.string().optional(),
        at: z.number().optional(),
      }),
    )
    .optional(),
  dismissedIds: z.array(z.string().uuid()).optional(),
  recentlyViewedIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const session = await getAuthSession();
  const userId =
    session?.user && "id" in session.user && typeof session.user.id === "string"
      ? session.user.id
      : null;

  const locale = parsed.data.locale?.trim() || "ko";

  const items = await computePersonalizedRecommendations({
    userId,
    locale,
    searchSignals: (parsed.data.searchSignals ?? []) as ExploreSearchSignal[],
    clientDismissedIds: parsed.data.dismissedIds ?? [],
    clientRecentlyViewedIds: parsed.data.recentlyViewedIds ?? [],
  });

  return NextResponse.json({
    ok: true,
    items,
    authenticated: Boolean(userId),
  });
}
