"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, FileText, PenLine, CreditCard, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/contract/PaymentModal";

export type InquiryContractSummary = {
  id: string;
  status: "DRAFT" | "AWAITING_MEDIA_OWNER" | "COMPLETED";
  advertiserSignedAt: string | null;
  mediaOwnerSignedAt: string | null;
} | null;

type ApiPayload = {
  ok: boolean;
  contract: {
    id: string;
    inquiryId: string;
    agreedBudgetKrw: number | null;
    agreedPeriod: string | null;
    status: "DRAFT" | "AWAITING_MEDIA_OWNER" | "COMPLETED";
    advertiserSignName: string | null;
    advertiserSignedAt: string | null;
    mediaOwnerSignName: string | null;
    mediaOwnerSignedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  inquiry: {
    id: string;
    status: string;
    message: string;
    budget: number | null;
    desiredPeriod: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    createdAt: string;
  };
  media: {
    id: string;
    name: string;
    type: string;
    weeklyPriceKrw: number | null;
    locationLabel: string;
  };
  advertiserEmail: string;
  mediaOwnerEmail: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  inquiryId: string;
  locale: string;
  viewerRole: "advertiser" | "media_owner";
  onPaid?: () => void;
};

function money(v: number | null): string {
  if (v == null) return "—";
  return `${v.toLocaleString()}원`;
}

export function InquiryContractModal({
  open,
  onClose,
  inquiryId,
  locale,
  viewerRole,
  onPaid,
}: Props) {
  const t = useTranslations("dashboard.inquiryContract");
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [data, setData] = React.useState<ApiPayload | null>(null);
  const [agreedBudget, setAgreedBudget] = React.useState("");
  const [agreedPeriod, setAgreedPeriod] = React.useState("");
  const [signerName, setSignerName] = React.useState("");
  const [payOpen, setPayOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/inquiries/${inquiryId}/contract`, {
        credentials: "include",
      });
      const json = (await res.json()) as ApiPayload & { error?: string };
      if (!res.ok) {
        toast.error(t("load_error"), { description: json.error });
        setData(null);
        return;
      }
      setData(json);
      if (!json.contract) {
        setAgreedBudget(
          json.inquiry.budget != null ? String(json.inquiry.budget) : "",
        );
        setAgreedPeriod(json.inquiry.desiredPeriod ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [inquiryId, t]);

  React.useEffect(() => {
    if (!open) {
      setData(null);
      setSignerName("");
      setPayOpen(false);
      return;
    }
    void load();
  }, [open, load]);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  async function createContract() {
    if (!data) return;
    setBusy(true);
    try {
      const body: { agreedBudgetKrw?: number; agreedPeriod?: string } = {};
      const b = agreedBudget.trim();
      if (b.length > 0) {
        const n = Number(b.replace(/,/g, ""));
        if (!Number.isFinite(n) || n < 0) {
          toast.error(t("budget_invalid"));
          return;
        }
        body.agreedBudgetKrw = Math.round(n);
      }
      const p = agreedPeriod.trim();
      if (p.length > 0) body.agreedPeriod = p;

      const res = await fetch(`/api/dashboard/inquiries/${inquiryId}/contract`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(t("create_error"), { description: json.error });
        return;
      }
      toast.success(t("created"));
      await load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sign() {
    const n = signerName.trim();
    if (n.length < 2) {
      toast.error(t("name_required"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/inquiries/${inquiryId}/contract`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: n }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(t("sign_error"), { description: json.error });
        return;
      }
      toast.success(t("signed"));
      setSignerName("");
      await load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/dashboard/inquiries/${inquiryId}/contract/pdf`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(t("pdf_error"), { description: j.error });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xthex-contract-${inquiryId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const estimatedCost =
    data?.inquiry.budget != null
      ? data.inquiry.budget
      : data?.media.weeklyPriceKrw != null
        ? data.media.weeklyPriceKrw
        : null;

  const statusLabel = (s: string) => {
    if (s === "DRAFT") return t("status_draft");
    if (s === "AWAITING_MEDIA_OWNER") return t("status_awaiting_media");
    if (s === "COMPLETED") return t("status_completed");
    return s;
  };

  const canCreate =
    viewerRole === "advertiser" &&
    data &&
    !data.contract &&
    data.inquiry.status !== "CLOSED";

  const canSignAdvertiser =
    data?.contract?.status === "DRAFT" &&
    !data.contract.advertiserSignedAt &&
    viewerRole === "advertiser";

  const canSignMedia =
    data?.contract?.status === "AWAITING_MEDIA_OWNER" &&
    !data.contract.mediaOwnerSignedAt &&
    viewerRole === "media_owner";

  const showPdf =
    data?.contract != null &&
    (data.contract.status === "COMPLETED" ||
      data.contract.advertiserSignedAt != null);

  return (
    <>
      <div
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
        role="dialog"
        aria-modal
        aria-labelledby="inquiry-contract-title"
      >
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 dark:border-zinc-700 dark:bg-zinc-950">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2
                id="inquiry-contract-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {t("title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading || !data ? (
            <p className="text-sm text-zinc-500">{t("loading")}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    {t("party_advertiser")}
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-200">
                    {data.advertiserEmail}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {data.inquiry.contactEmail ?? "—"} /{" "}
                    {data.inquiry.contactPhone ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                    <FileText className="h-4 w-4 text-blue-600" />
                    {t("party_media")}
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data.media.name}
                  </p>
                  <p className="text-xs uppercase text-zinc-500">{data.media.type}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {data.media.locationLabel}
                  </p>
                  {data.mediaOwnerEmail ? (
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                      {data.mediaOwnerEmail}
                    </p>
                  ) : null}
                </div>
              </div>

              {data.contract ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabel(data.contract.status)}</Badge>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("conditions_title")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-zinc-500">{t("field_budget")}</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {data.contract
                        ? money(data.contract.agreedBudgetKrw)
                        : money(data.inquiry.budget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{t("field_period")}</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {data.contract?.agreedPeriod ??
                        data.inquiry.desiredPeriod ??
                        "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{t("estimated_cost")}</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {money(estimatedCost)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-zinc-500">{t("message_label")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-200">
                    {data.inquiry.message}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("terms_title")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
                  <li>{t("term_1")}</li>
                  <li>{t("term_2")}</li>
                  <li>{t("term_3")}</li>
                  <li>{t("term_4")}</li>
                </ul>
              </div>

              {data.contract ? (
                <div className="mt-4 space-y-2 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("signatures_title")}
                  </p>
                  <p>
                    {t("sign_advertiser")}:{" "}
                    <span className="font-medium">
                      {data.contract.advertiserSignName ?? "—"}
                    </span>{" "}
                    <span className="text-xs text-zinc-500">
                      {data.contract.advertiserSignedAt ?? ""}
                    </span>
                  </p>
                  <p>
                    {t("sign_media_owner")}:{" "}
                    <span className="font-medium">
                      {data.contract.mediaOwnerSignName ?? "—"}
                    </span>{" "}
                    <span className="text-xs text-zinc-500">
                      {data.contract.mediaOwnerSignedAt ?? ""}
                    </span>
                  </p>
                </div>
              ) : null}

              {canCreate ? (
                <div className="mt-4 space-y-3 rounded-xl border border-dashed border-emerald-300/80 bg-emerald-50/40 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {t("create_title")}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {t("create_hint")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="agreed-budget">{t("field_budget")}</Label>
                      <Input
                        id="agreed-budget"
                        inputMode="numeric"
                        value={agreedBudget}
                        onChange={(e) => setAgreedBudget(e.target.value)}
                        placeholder={t("budget_placeholder")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agreed-period">{t("field_period")}</Label>
                      <Input
                        id="agreed-period"
                        value={agreedPeriod}
                        onChange={(e) => setAgreedPeriod(e.target.value)}
                        placeholder={t("period_placeholder")}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    disabled={busy}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => void createContract()}
                  >
                    {t("create_submit")}
                  </Button>
                </div>
              ) : null}

              {canSignAdvertiser || canSignMedia ? (
                <div className="mt-4 space-y-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <Label htmlFor="signer-name">
                    {canSignAdvertiser ? t("sign_advertiser_prompt") : t("sign_media_prompt")}
                  </Label>
                  <Input
                    id="signer-name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder={t("signer_placeholder")}
                    autoComplete="name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void sign()}
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    {t("sign_submit")}
                  </Button>
                </div>
              ) : null}

              {data.contract?.status === "AWAITING_MEDIA_OWNER" &&
              viewerRole === "advertiser" ? (
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("awaiting_media_hint")}
                </p>
              ) : null}

              {data.contract?.status === "COMPLETED" ? (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
                  {t("completed_hint")}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2">
                {showPdf ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void downloadPdf()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("download_pdf")}
                  </Button>
                ) : null}
                {viewerRole === "advertiser" &&
                data.contract?.status === "COMPLETED" ? (
                  <Button
                    type="button"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setPayOpen(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("payment_cta")}
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" onClick={onClose}>
                  {t("close")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        inquiryId={inquiryId}
        locale={locale}
        onPaid={() => {
          onPaid?.();
          onClose();
        }}
      />
    </>
  );
}
