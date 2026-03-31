import { Resend } from "resend";
import { inquiryConfirmationHtml } from "./templates/inquiry-confirmation";
import { bookingConfirmationHtml } from "./templates/booking-confirmation";
import {
  campaignInvoiceIssuedHtml,
  campaignInvoiceReminderHtml,
} from "./templates/campaign-invoice";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

const FROM =
  process.env.RESEND_FROM || "XtheX <noreply@xthex.com>";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adminInquiryNotifyRecipients(): string[] {
  const raw = process.env.ADMIN_INQUIRY_NOTIFY_EMAIL?.trim();
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(/[,;]+/)
        .map((x) => x.trim().toLowerCase())
        .filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)),
    ),
  ];
}

/** Resend → comma-separated ADMIN_INQUIRY_NOTIFY_EMAIL */
export async function sendAdminInquiryNotification(p: {
  mediaTitle: string;
  inquiryId: string;
  advertiserEmail?: string | null;
}): Promise<{ ok: true } | { ok: false; skipped?: boolean; error?: unknown }> {
  const to = adminInquiryNotifyRecipients();
  if (to.length === 0) return { ok: false, skipped: true };
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping admin inquiry notify");
    return { ok: false, skipped: true };
  }
  const adv = p.advertiserEmail ? escHtml(p.advertiserEmail) : "—";
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif">
<p><strong>New inquiry</strong> (XtheX)</p>
<ul>
<li>Media: ${escHtml(p.mediaTitle)}</li>
<li>Inquiry ID: <code>${escHtml(p.inquiryId)}</code></li>
<li>Advertiser contact: ${adv}</li>
</ul>
<p>Open <strong>Admin → Inquiries</strong> in the dashboard.</p>
</body></html>`;
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `[XtheX Admin] New inquiry — ${p.mediaTitle}`,
    html,
  });
  if (error) {
    console.error("[email] admin inquiry notify failed:", error);
    return { ok: false, error };
  }
  return { ok: true };
}

export type InquiryEmailPayload = {
  to: string;
  mediaTitle: string;
  message: string;
  inquiryId: string;
};

export type BookingEmailPayload = {
  to: string;
  mediaTitle: string;
  startDate: string;
  endDate: string;
  budget?: number;
  bookingId: string;
};

export async function sendInquiryConfirmation(payload: InquiryEmailPayload) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping inquiry email");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: `[XtheX] 문의 접수 확인 — ${payload.mediaTitle}`,
    html: inquiryConfirmationHtml(payload),
  });

  if (error) {
    console.error("[email] inquiry confirmation failed:", error);
    return null;
  }

  return data;
}

export async function sendSecurityOtpEmail(to: string, code: string) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — security OTP not sent");
    return { ok: false as const, skipped: true };
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "[XtheX] Security verification code",
    html: `<p>Your XtheX security code is:</p><p style="font-size:26px;font-weight:700;letter-spacing:6px;font-family:monospace">${code}</p><p style="color:#64748b;font-size:14px">Valid for 10 minutes. If you did not request this, ignore this email.</p>`,
  });
  if (error) {
    console.error("[email] security OTP failed:", error);
    return { ok: false as const, error };
  }
  return { ok: true as const };
}

export async function sendBookingConfirmation(payload: BookingEmailPayload) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping booking email");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: `[XtheX] 예약 요청 확인 — ${payload.mediaTitle}`,
    html: bookingConfirmationHtml(payload),
  });

  if (error) {
    console.error("[email] booking confirmation failed:", error);
    return null;
  }

  return data;
}

function appDashboardInvoicesUrl(): string | null {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!base) return null;
  return `${base}/dashboard/advertiser/invoices`;
}

export type CampaignInvoiceIssuedPayload = {
  to: string;
  campaignTitle: string;
  amountKrw: number;
  campaignEndAtIso: string;
  dueAtIso: string;
  invoiceId: string;
};

export async function sendCampaignInvoiceIssuedEmail(
  payload: CampaignInvoiceIssuedPayload,
): Promise<{ ok: true } | { ok: false; skipped?: boolean; error?: unknown }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping invoice issued email");
    return { ok: false, skipped: true };
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: `[XtheX] Invoice issued — ${payload.campaignTitle}`,
    html: campaignInvoiceIssuedHtml({
      campaignTitle: payload.campaignTitle,
      amountKrw: payload.amountKrw,
      campaignEndAtIso: payload.campaignEndAtIso,
      dueAtIso: payload.dueAtIso,
      invoiceId: payload.invoiceId,
      dashboardUrl: appDashboardInvoicesUrl(),
    }),
  });
  if (error) {
    console.error("[email] invoice issued failed:", error);
    return { ok: false, error };
  }
  return { ok: true };
}

export type CampaignInvoiceReminderPayload = {
  to: string;
  campaignTitle: string;
  amountKrw: number;
  dueAtIso: string;
  invoiceId: string;
  variant: "before_due" | "overdue";
};

export async function sendCampaignInvoiceReminderEmail(
  payload: CampaignInvoiceReminderPayload,
): Promise<{ ok: true } | { ok: false; skipped?: boolean; error?: unknown }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping invoice reminder");
    return { ok: false, skipped: true };
  }
  const subj =
    payload.variant === "overdue"
      ? `[XtheX] Overdue invoice — ${payload.campaignTitle}`
      : `[XtheX] Payment due soon — ${payload.campaignTitle}`;
  const { error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: subj,
    html: campaignInvoiceReminderHtml({
      campaignTitle: payload.campaignTitle,
      amountKrw: payload.amountKrw,
      dueAtIso: payload.dueAtIso,
      invoiceId: payload.invoiceId,
      variant: payload.variant,
      dashboardUrl: appDashboardInvoicesUrl(),
    }),
  });
  if (error) {
    console.error("[email] invoice reminder failed:", error);
    return { ok: false, error };
  }
  return { ok: true };
}
