"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Shield, Smartphone, Mail, Fingerprint, Monitor, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type DeviceRow = {
  id: string;
  deviceKey: string;
  nickname: string | null;
  userAgent: string | null;
  ipLast: string | null;
  lastSeenAt: string;
  createdAt: string;
};

type PasskeyRow = { credentialId: string; createdAt: string };

type StatusPayload = {
  demo?: boolean;
  twoFactorEnabled: boolean;
  emailOtpEnabled: boolean;
  smsOtpEnabled: boolean;
  phoneE164: string | null;
  securityPhoneVerified: boolean;
  devices: DeviceRow[];
  passkeys: PasskeyRow[];
};

export function SecuritySettingsClient() {
  const t = useTranslations("security");
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<StatusPayload | null>(null);

  const [totpSecret, setTotpSecret] = React.useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = React.useState<string | null>(null);
  const [totpCode, setTotpCode] = React.useState("");
  const [backupCodes, setBackupCodes] = React.useState<string[] | null>(null);

  const [disablePassword, setDisablePassword] = React.useState("");
  const [disableCode, setDisableCode] = React.useState("");

  const [emailCode, setEmailCode] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [sms2fa, setSms2fa] = React.useState(false);
  const [passkeyBusy, setPasskeyBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security/status", { credentials: "include" });
      const data = (await res.json()) as StatusPayload;
      setStatus(data);
      setPhone(data.phoneE164 ?? "");
    } catch {
      toast.error(t("toast_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function startTotpSetup() {
    try {
      const res = await fetch("/api/security/totp/setup", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setBackupCodes(null);
    } catch {
      toast.error(t("toast_totp_setup_failed"));
    }
  }

  async function confirmTotp() {
    if (!totpSecret || !totpCode.trim()) return;
    try {
      const res = await fetch("/api/security/totp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ secret: totpSecret, code: totpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBackupCodes(data.backupCodes ?? []);
      setTotpSecret(null);
      setOtpauthUrl(null);
      setTotpCode("");
      toast.success(t("toast_totp_enabled"));
      void load();
    } catch {
      toast.error(t("toast_totp_invalid"));
    }
  }

  async function disableTotp() {
    try {
      const res = await fetch("/api/security/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: disablePassword, code: disableCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDisablePassword("");
      setDisableCode("");
      toast.success(t("toast_totp_disabled"));
      void load();
    } catch {
      toast.error(t("toast_totp_disable_failed"));
    }
  }

  async function sendEmailCode() {
    try {
      const res = await fetch("/api/security/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.devCode) toast.message(t("toast_email_dev", { code: data.devCode }));
      else toast.success(t("toast_email_sent"));
    } catch {
      toast.error(t("toast_email_send_failed"));
    }
  }

  async function verifyEmailCode() {
    try {
      const res = await fetch("/api/security/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "verify", code: emailCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailCode("");
      toast.success(t("toast_email_verified"));
      void load();
    } catch {
      toast.error(t("toast_email_verify_failed"));
    }
  }

  async function toggleEmailPref(on: boolean) {
    try {
      const res = await fetch("/api/security/email-preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailOtpEnabled: on }),
      });
      if (!res.ok) throw new Error();
      toast.success(on ? t("toast_email_pref_on") : t("toast_email_pref_off"));
      void load();
    } catch {
      toast.error(t("toast_pref_failed"));
    }
  }

  async function saveSms() {
    try {
      const res = await fetch("/api/security/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phoneE164: phone.trim() || null,
          enableSms2fa: sms2fa,
          sendTest: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(t("toast_sms_saved"));
      void load();
    } catch {
      toast.error(t("toast_sms_failed"));
    }
  }

  async function registerPasskey() {
    setPasskeyBusy(true);
    try {
      const optRes = await fetch("/api/security/webauthn/register-options", {
        method: "POST",
        credentials: "include",
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error);

      const { startRegistration } = await import("@simplewebauthn/browser");
      const att = await startRegistration({ optionsJSON: options });

      const vRes = await fetch("/api/security/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ response: att }),
      });
      const vData = await vRes.json();
      if (!vRes.ok) throw new Error(vData.error);
      toast.success(t("toast_passkey_added"));
      void load();
    } catch (e) {
      console.error(e);
      toast.error(t("toast_passkey_failed"));
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function removePasskey(id: string) {
    try {
      const res = await fetch(
        `/api/security/webauthn/${encodeURIComponent(id)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) throw new Error();
      toast.success(t("toast_passkey_removed"));
      void load();
    } catch {
      toast.error(t("toast_passkey_remove_failed"));
    }
  }

  async function removeDevice(id: string) {
    try {
      const res = await fetch(`/api/security/devices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success(t("toast_device_removed"));
      void load();
    } catch {
      toast.error(t("toast_device_remove_failed"));
    }
  }

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Link
          href="/dashboard/advertiser/settings"
          className={cn(
            "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-input",
            "bg-background px-3 text-sm font-medium transition-all duration-150",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "ring-offset-background active:scale-95",
          )}
        >
          {t("back_settings")}
        </Link>
      </div>

      {status?.demo ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          {t("demo_db")}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            {t("totp_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">{t("totp_desc")}</p>
          {status?.twoFactorEnabled ? (
            <p className="font-medium text-emerald-600 dark:text-emerald-400">{t("totp_on")}</p>
          ) : (
            <p className="text-muted-foreground">{t("totp_off")}</p>
          )}

          {!status?.twoFactorEnabled && !totpSecret ? (
            <Button type="button" variant="secondary" onClick={() => void startTotpSetup()}>
              {t("totp_start")}
            </Button>
          ) : null}

          {otpauthUrl && totpSecret ? (
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{t("totp_scan")}</p>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <QRCodeSVG value={otpauthUrl} size={160} className="rounded-lg bg-white p-2" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="break-all font-mono text-xs text-muted-foreground">{totpSecret}</p>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder={t("totp_code_ph")}
                      className="max-w-[200px]"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <Button type="button" onClick={() => void confirmTotp()}>
                      {t("totp_confirm")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {backupCodes?.length ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
              <p className="mb-2 font-medium text-amber-900 dark:text-amber-100">{t("backup_title")}</p>
              <ul className="grid grid-cols-2 gap-1 font-mono text-sm sm:grid-cols-4">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{t("backup_hint")}</p>
            </div>
          ) : null}

          {status?.twoFactorEnabled ? (
            <div className="space-y-2 border-t pt-4">
              <p className="font-medium">{t("totp_disable")}</p>
              <Input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder={t("password_ph")}
                className="max-w-md"
              />
              <Input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder={t("totp_or_backup_ph")}
                className="max-w-md"
                inputMode="numeric"
              />
              <Button type="button" variant="outline" onClick={() => void disableTotp()}>
                {t("totp_disable_btn")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            {t("email_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{t("email_desc")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void sendEmailCode()}>
              {t("email_send")}
            </Button>
            <Input
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder={t("email_code_ph")}
              className="max-w-[140px]"
              inputMode="numeric"
            />
            <Button type="button" size="sm" onClick={() => void verifyEmailCode()}>
              {t("email_verify")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant={status?.emailOtpEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => void toggleEmailPref(!status?.emailOtpEnabled)}
            >
              {status?.emailOtpEnabled ? t("email_pref_on") : t("email_pref_off")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            {t("sms_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{t("sms_desc")}</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={sms2fa}
              onChange={(e) => setSms2fa(e.target.checked)}
            />
            {t("sms_enable_flag")}
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("sms_ph")}
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void saveSms()}>
              {t("sms_save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch("/api/security/sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      phoneE164: phone.trim(),
                      enableSms2fa: sms2fa,
                      sendTest: true,
                    }),
                  });
                  const data = await res.json();
                  if (data.demo) toast.message(data.message);
                  else if (data.ok === false) toast.message(data.message ?? t("sms_stub"));
                  else toast.success(t("toast_sms_test"));
                } catch {
                  toast.error(t("toast_sms_failed"));
                }
              }}
            >
              {t("sms_test")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5" />
            {t("passkey_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{t("passkey_desc")}</p>
          <Button type="button" disabled={passkeyBusy} onClick={() => void registerPasskey()}>
            {passkeyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("passkey_add")}
          </Button>
          <ul className="space-y-2">
            {status?.passkeys?.map((p) => (
              <li
                key={p.credentialId}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span className="truncate font-mono text-xs">{p.credentialId.slice(0, 24)}…</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void removePasskey(p.credentialId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5" />
            {t("devices_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{t("devices_desc")}</p>
          <ul className="space-y-2">
            {status?.devices?.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{d.userAgent ?? t("device_unknown")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("device_last", { time: new Date(d.lastSeenAt).toLocaleString() })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void removeDevice(d.id)}
                >
                  {t("device_revoke")}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
