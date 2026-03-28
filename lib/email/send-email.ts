import { Resend } from "resend";
import { inquiryConfirmationHtml } from "./templates/inquiry-confirmation";
import { bookingConfirmationHtml } from "./templates/booking-confirmation";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

const FROM =
  process.env.RESEND_FROM || "XtheX <noreply@xthex.com>";

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
