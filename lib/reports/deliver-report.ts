import type { PeriodSummary } from "./generate-summary";

type WeeklyReport = { weekly: PeriodSummary; monthly: PeriodSummary };

function formatPeriod(summary: PeriodSummary): string {
  const since = new Date(summary.since).toLocaleDateString("ko-KR");
  const until = new Date(summary.until).toLocaleDateString("ko-KR");
  return [
    `📅 ${since} ~ ${until} (${summary.days}일)`,
    `  • 공개 매체(신규): ${summary.mediaPublished} (전체 ${summary.totals.mediaPublished})`,
    `  • 문의: ${summary.inquiries} (전체 ${summary.totals.inquiries})`,
    `  • 제안서: ${summary.proposals} (승인 ${summary.proposalsApproved} / 대기 ${summary.proposalsPending}, 전체 ${summary.totals.proposals})`,
    `  • 캠페인 초안: ${summary.campaignDrafts} (전체 ${summary.totals.campaignDrafts})`,
  ].join("\n");
}

/**
 * Slack Incoming Webhook으로 보고서 전송.
 * SLACK_WEBHOOK_URL 이 설정된 경우에만 동작.
 */
export async function sendReportToSlack(
  report: WeeklyReport,
  generatedAt: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url?.startsWith("https://")) {
    return { ok: false, error: "SLACK_WEBHOOK_URL not set" };
  }

  const text = [
    "📊 *XtheX 주간/월간 보고서*",
    `_생성: ${new Date(generatedAt).toLocaleString("ko-KR")}_`,
    "",
    "*최근 7일*",
    formatPeriod(report.weekly),
    "",
    "*최근 30일*",
    formatPeriod(report.monthly),
  ].join("\n");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Slack ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Resend API로 보고서 이메일 전송.
 * RESEND_API_KEY, RESEND_FROM, REPORT_EMAIL_TO 가 설정된 경우에만 동작.
 */
export async function sendReportByEmail(
  report: WeeklyReport,
  generatedAt: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM; // e.g. "XtheX <reports@yourdomain.com>"
  const to = process.env.REPORT_EMAIL_TO; // comma-separated or single

  if (!apiKey || !from || !to) {
    return {
      ok: false,
      error: "RESEND_API_KEY, RESEND_FROM, or REPORT_EMAIL_TO not set",
    };
  }

  const html = [
    "<h1>XtheX 주간/월간 보고서</h1>",
    `<p>생성: ${new Date(generatedAt).toLocaleString("ko-KR")}</p>`,
    "<h2>최근 7일</h2>",
    "<pre>" + formatPeriod(report.weekly).replace(/</g, "&lt;") + "</pre>",
    "<h2>최근 30일</h2>",
    "<pre>" + formatPeriod(report.monthly).replace(/</g, "&lt;") + "</pre>",
  ].join("");

  const toList = to.split(",").map((e) => e.trim()).filter(Boolean);
  if (toList.length === 0) {
    return { ok: false, error: "REPORT_EMAIL_TO is empty" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: toList,
        subject: `[XtheX] 주간 보고서 ${new Date(generatedAt).toLocaleDateString("ko-KR")}`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as any)?.message ?? (await res.text());
      return { ok: false, error: `Resend ${res.status}: ${msg}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
