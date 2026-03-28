import { prisma } from "@/lib/prisma";

export type PartnerMediaWebhookPayload = {
  source: "xthex";
  event: "media.updated" | "media.deleted" | "media.status_changed";
  mediaId: string;
  status: string;
  updatedAt: string;
};

/**
 * 매체 소유자(createdById)에게 등록된 웹훅이 있으면 비동기 POST.
 * 서명 없음 — HTTPS 엔드포인트 권장.
 */
export function firePartnerMediaWebhook(
  ownerUserId: string,
  payload: PartnerMediaWebhookPayload,
): void {
  void (async () => {
    const hook = await prisma.partnerMediaWebhook.findUnique({
      where: { userId: ownerUserId },
    });
    if (!hook?.enabled || !hook.url.trim()) return;
    try {
      await fetch(hook.url.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "XtheX-PartnerWebhook/1",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      /* best-effort */
    }
  })();
}
