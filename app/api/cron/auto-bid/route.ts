import { NextResponse } from "next/server";
import { executeAllDueAutoBidRules } from "@/lib/auto-bid/execute-rule";

export const runtime = "nodejs";

/**
 * Vercel Cron 등에서 호출. 환경변수 CRON_SECRET과 Authorization: Bearer <secret> 필요.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await executeAllDueAutoBidRules();
  return NextResponse.json({ ok: true, ...summary });
}
