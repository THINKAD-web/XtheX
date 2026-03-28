import type { InquiryEmailPayload } from "../send-email";

export function inquiryConfirmationHtml(p: InquiryEmailPayload): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ea580c,#f97316);padding:32px 40px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">XtheX</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">글로벌 옥외광고 마켓플레이스</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <h2 style="margin:0 0 16px;font-size:20px;color:#18181b">문의가 접수되었습니다</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6">
              아래 매체에 대한 문의가 정상적으로 접수되었습니다. 매체사 확인 후 빠른 시일 내 답변 드리겠습니다.
            </p>
            <table width="100%" cellpadding="12" cellspacing="0" style="background:#fafafa;border-radius:8px;border:1px solid #e4e4e7">
              <tr>
                <td style="font-size:13px;color:#71717a;width:100px;vertical-align:top">매체</td>
                <td style="font-size:14px;color:#18181b;font-weight:600">${esc(p.mediaTitle)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#71717a;vertical-align:top">문의 번호</td>
                <td style="font-size:14px;color:#18181b;font-family:monospace">${esc(p.inquiryId)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#71717a;vertical-align:top">문의 내용</td>
                <td style="font-size:14px;color:#18181b;line-height:1.5">${esc(p.message).slice(0, 500)}</td>
              </tr>
            </table>
            <div style="margin:32px 0 0;text-align:center">
              <a href="https://xthex.com/ko/dashboard/advertiser/inquiries"
                 style="display:inline-block;padding:12px 28px;background:#ea580c;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                대시보드에서 확인하기
              </a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center">
            <p style="margin:0;font-size:12px;color:#a1a1aa">&copy; ${new Date().getFullYear()} XtheX. All rights reserved.</p>
            <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa">이 메일은 발신 전용입니다.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
