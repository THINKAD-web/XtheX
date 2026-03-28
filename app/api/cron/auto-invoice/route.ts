import { NextResponse } from "next/server";
import { runAutoInvoiceJob } from "@/lib/invoice/auto-process";

export const runtime = "nodejs";

/**
 * GET /api/cron/auto-invoice
 * 캠페인 종료(집행 기간 만료) 시 인보이스 생성·발행 메일, 마감 리마인더 메일.
 * Authorization: Bearer ${CRON_SECRET}
 *
 * 환경 변수 (선택):
 * - INVOICE_DUE_DAYS_AFTER_END (기본 14): 종료일 이후 며칠 뒤를 납기로 할지
 * - INVOICE_REMINDER_BEFORE_DUE_DAYS (기본 3): 납기 며칠 전부터 리마인더 가능
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

  try {
    const result = await runAutoInvoiceJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron] auto-invoice:", e);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
