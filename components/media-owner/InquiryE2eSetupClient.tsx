"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateInquiryE2eKeyPair } from "@/lib/crypto/inquiry-e2e-browser";
import { EncryptionBadge } from "@/components/encryption/EncryptionBadge";

export function InquiryE2eSetupClient() {
  const t = useTranslations("encryption");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [current, setCurrent] = React.useState<string | null>(null);
  const [paste, setPaste] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security/inquiry-e2e-key", { credentials: "include" });
      const j = (await res.json()) as { publicKeySpki?: string | null; demo?: boolean };
      setCurrent(j.publicKeySpki?.trim() ?? null);
    } catch {
      toast.error(t("toast_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onGenerate() {
    try {
      const { publicSpkiB64, privatePkcs8Pem } = await generateInquiryE2eKeyPair();
      const blob = new Blob([privatePkcs8Pem], { type: "application/x-pem-file" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "xthex-inquiry-e2e-private.pem";
      a.click();
      URL.revokeObjectURL(a.href);
      setPaste(publicSpkiB64);
      toast.message(t("toast_keygen"));
    } catch {
      toast.error(t("toast_keygen_failed"));
    }
  }

  async function onSave() {
    const v = paste.trim();
    if (v.length < 40) {
      toast.error(t("toast_invalid_key"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/security/inquiry-e2e-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicKeySpki: v }),
      });
      if (!res.ok) throw new Error();
      setCurrent(v);
      toast.success(t("toast_saved"));
    } catch {
      toast.error(t("toast_save_failed"));
    } finally {
      setSaving(false);
    }
  }

  async function onClear() {
    setSaving(true);
    try {
      const res = await fetch("/api/security/inquiry-e2e-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicKeySpki: null }),
      });
      if (!res.ok) throw new Error();
      setCurrent(null);
      setPaste("");
      toast.success(t("toast_cleared"));
    } catch {
      toast.error(t("toast_clear_failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/media-owner"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← {t("back_dashboard")}
        </Link>
        {current ? <EncryptionBadge label={t("badge_active")} /> : null}
      </div>

      <div
        className={`rounded-2xl border border-emerald-200/80 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900`}
      >
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("setup_title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("setup_subtitle")}</p>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">{t("loading")}</p>
        ) : (
          <div className="mt-6 space-y-4">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
              <li>{t("step_generate")}</li>
              <li>{t("step_store_private")}</li>
              <li>{t("step_publish_public")}</li>
            </ol>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void onGenerate()}>
                {t("cta_generate")}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("public_spki_label")}
              </label>
              <Input
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={t("public_spki_ph")}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={saving} onClick={() => void onSave()}>
                {saving ? t("saving") : t("cta_save")}
              </Button>
              <Button type="button" variant="outline" disabled={saving || !current} onClick={() => void onClear()}>
                {t("cta_clear")}
              </Button>
            </div>

            <p className="text-xs text-amber-800 dark:text-amber-200">{t("warning_private")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
