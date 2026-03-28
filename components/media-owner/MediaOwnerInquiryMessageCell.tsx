"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decryptInquiryEnvelope } from "@/lib/crypto/inquiry-e2e-browser";
import { E2E_INQUIRY_PLACEHOLDER } from "@/lib/crypto/inquiry-e2e-constants";
import { EncryptionBadge } from "@/components/encryption/EncryptionBadge";

type Props = {
  message: string;
  sensitiveEnvelope: string | null;
  e2eEncrypted: boolean;
};

export function MediaOwnerInquiryMessageCell({
  message,
  sensitiveEnvelope,
  e2eEncrypted,
}: Props) {
  const t = useTranslations("encryption");
  const [pem, setPem] = React.useState("");
  const [plain, setPlain] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const isPlaceholder = message === E2E_INQUIRY_PLACEHOLDER || e2eEncrypted;

  async function onDecrypt() {
    if (!sensitiveEnvelope || !pem.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const payload = await decryptInquiryEnvelope(pem.trim(), sensitiveEnvelope);
      const lines = [payload.message];
      if (payload.contactPhone) lines.push(`${t("decrypt_phone_label")}: ${payload.contactPhone}`);
      setPlain(lines.join("\n\n"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("decrypt_failed"));
    } finally {
      setBusy(false);
    }
  }

  if (!e2eEncrypted && !sensitiveEnvelope) {
    return <span className="line-clamp-2">{message}</span>;
  }

  return (
    <div className="max-w-md space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <EncryptionBadge label={t("badge_e2e")} />
      </div>
      <p className="text-xs text-zinc-500">{t("owner_hint")}</p>
      {plain ? (
        <Textarea readOnly value={plain} className="min-h-[100px] text-xs" rows={5} />
      ) : (
        <>
          <Textarea
            value={pem}
            onChange={(e) => setPem(e.target.value)}
            placeholder={t("decrypt_pem_ph")}
            className="min-h-[72px] font-mono text-[11px]"
            rows={4}
          />
          {err ? <p className="text-xs text-red-600">{err}</p> : null}
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onDecrypt()}>
            {busy ? t("decrypt_busy") : t("decrypt_cta")}
          </Button>
        </>
      )}
    </div>
  );
}
