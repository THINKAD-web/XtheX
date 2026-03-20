import { NextResponse } from "next/server";
import { generateWeeklyReport } from "@/lib/reports/generate-summary";
import {
  sendReportToSlack,
  sendReportByEmail,
} from "@/lib/reports/deliver-report";

/**
 * GET /api/cron/weekly-report
 * Vercel Cron 또는 외부 스케줄러에서 주기적으로 호출합니다.
 * Authorization: Bearer <CRON_SECRET> 헤더 필요.
 *
 * 선택 환경 변수:
 * - SLACK_WEBHOOK_URL: 있으면 보고서를 Slack으로 전송
 * - RESEND_API_KEY, RESEND_FROM, REPORT_EMAIL_TO: 있으면 이메일 전송 (Resend)
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const vercelCron = req.headers.get("x-vercel-cron-secret");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : vercelCron;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await generateWeeklyReport();
    const generatedAt = new Date().toISOString();

    const [slackResult, emailResult] = await Promise.all([
      sendReportToSlack(report, generatedAt),
      sendReportByEmail(report, generatedAt),
    ]);

    if (!slackResult.ok && slackResult.error) {
      console.error("weekly-report Slack delivery:", slackResult.error);
    }
    if (!emailResult.ok && emailResult.error) {
      console.error("weekly-report Email delivery:", emailResult.error);
    }

    return NextResponse.json({
      generatedAt,
      weekly: report.weekly,
      monthly: report.monthly,
      delivery: {
        slack: slackResult.ok ? "sent" : (slackResult.error ?? "skipped"),
        email: emailResult.ok ? "sent" : (emailResult.error ?? "skipped"),
      },
    });
  } catch (e) {
    console.error("weekly-report cron error:", e);
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 },
    );
  }
}
