import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 10, windowMs: 60_000 });
  if (rl) return rl;

  try {
    const body = (await req.json()) as { rating?: number; message?: string };

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, demo: true });
    }

    await prisma.feedback.create({
      data: { rating, message: message || null, userAgent },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/feedback]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
