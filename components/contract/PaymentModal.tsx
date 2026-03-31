"use client";

import * as React from "react";
import { X, CreditCard } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onClose: () => void;
  inquiryId: string;
  locale?: string;
  onPaid: () => void;
};

const EMERALD = ["#10b981", "#34d399", "#059669", "#3b82f6"];

export function PaymentModal({ open, onClose, inquiryId, locale, onPaid }: Props) {
  const [pending, setPending] = React.useState(false);

  async function payWithStripe() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/inquiry/${inquiryId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: locale ?? "ko" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        useMock?: boolean;
      };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 501) {
        toast.message("Stripe 미설정", {
          description:
            process.env.NODE_ENV === "development"
              ? "아래 로컬 테스트 결제를 사용하거나 STRIPE_SECRET_KEY를 설정하세요."
              : data.error ?? "관리자에게 문의하세요.",
        });
        return;
      }
      toast.error("결제 세션을 열 수 없습니다.", { description: data.error });
    } catch (e) {
      toast.error("결제 처리 중 오류가 발생했습니다.", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPending(false);
    }
  }

  async function payMock(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/inquiry/${inquiryId}/mock-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error("결제에 실패했습니다.", { description: data.error });
        return;
      }
      toast.success("🎉 결제가 완료되었습니다!");
      confetti({
        particleCount: 55,
        spread: 55,
        origin: { y: 0.35, x: 0.5 },
        colors: EMERALD,
        zIndex: 999,
      });
      onPaid();
      onClose();
    } catch (e) {
      toast.error("결제 처리 중 오류가 발생했습니다.", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPending(false);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="payment-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="payment-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              결제
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Stripe가 설정된 경우 안전하게 카드 결제로 진행됩니다. 개발 환경에서는 테스트 결제를 사용할 수
              있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => void payWithStripe()}
          >
            <CreditCard className="h-4 w-4" />
            {pending ? "연결 중…" : "Stripe로 결제하기"}
          </Button>

          {process.env.NODE_ENV === "development" ? (
            <form onSubmit={payMock} className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <p className="text-xs font-medium text-zinc-500">로컬 전용 테스트 결제</p>
              <div className="space-y-1">
                <Label htmlFor="card-number">카드 번호</Label>
                <Input id="card-number" placeholder="4242 4242 4242 4242" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="card-exp">만료</Label>
                  <Input id="card-exp" placeholder="12/34" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="card-cvc">CVC</Label>
                  <Input id="card-cvc" placeholder="123" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-name">카드 소유자</Label>
                <Input id="card-name" placeholder="홍길동" required />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="secondary" disabled={pending} className="flex-1">
                  {pending ? "처리 중…" : "테스트 결제만 실행"}
                </Button>
                <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
                  취소
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
                닫기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
