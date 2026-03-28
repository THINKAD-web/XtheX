"use client";

import * as React from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  postAuthRedirectPath,
  safeInternalCallbackUrl,
} from "@/lib/auth/post-auth-redirect";

type Props = {
  /** 기본 `/signup` — `role`, `callbackUrl` 쿼리가 있으면 자동으로 전달합니다. */
  signupHref?: string;
  title: string;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  loadingLabel: string;
  googleLabel: string;
  noAccount: string;
  googleEnabled: boolean;
};

export function LoginForm({
  signupHref,
  title,
  emailLabel,
  passwordLabel,
  submitLabel,
  loadingLabel,
  googleLabel,
  noAccount,
  googleEnabled,
}: Props) {
  const searchParams = useSearchParams();
  const signupHrefWithParams = React.useMemo(() => {
    const base = signupHref ?? "/signup";
    const sp = new URLSearchParams();
    const role = searchParams.get("role");
    const cb = searchParams.get("callbackUrl");
    if (role) sp.set("role", role);
    if (cb) sp.set("callbackUrl", cb);
    const q = sp.toString();
    return q ? `${base}?${q}` : base;
  }, [searchParams, signupHref]);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const fieldErrors = React.useMemo(() => {
    const errs: Record<string, string> = {};
    if (touched.email && !email.trim()) errs.email = "이메일을 입력해 주세요.";
    else if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "올바른 이메일 형식이 아닙니다.";
    if (touched.password && !password)
      errs.password = "비밀번호를 입력해 주세요.";
    return errs;
  }, [email, password, touched]);

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        ...(totpCode.trim() ? { totpCode: totpCode.trim() } : {}),
      });
      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      const cb = safeInternalCallbackUrl(searchParams.get("callbackUrl"));
      /** credentials 로그인 직후 클라이언트 세션이 한 박자 늦을 수 있음 → 짧게 폴링 후 이동 */
      let role: string | undefined;
      for (let i = 0; i < 15; i++) {
        const session = await getSession();
        role = session?.user?.role;
        if (role != null || session?.user?.id) break;
        await new Promise((r) => setTimeout(r, 80));
      }
      try {
        let dk = window.localStorage.getItem("xthex_device_key");
        if (!dk) {
          dk = crypto.randomUUID();
          window.localStorage.setItem("xthex_device_key", dk);
        }
        await fetch("/api/security/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ deviceKey: dk }),
        });
      } catch {
        // non-blocking
      }

      const target = cb ?? postAuthRedirectPath(role);
      /** 전체 로드로 세션 쿠키가 확실히 반영되게 (미들웨어·리다이렉트 꼬임 방지) */
      window.location.assign(target);
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const cb = safeInternalCallbackUrl(searchParams.get("callbackUrl"));
    await signIn("google", {
      callbackUrl: cb ?? "/dashboard/advertiser",
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <form onSubmit={onCredentials} className="space-y-4">
        {error ? (
          <p
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            {emailLabel}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => markTouched("email")}
            className={`h-11 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="password"
          >
            {passwordLabel}
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => markTouched("password")}
            className={`h-11 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <details className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            2단계 인증 코드 (Authenticator / 백업 코드)
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">
            계정에서 OTP를 켠 경우 6자리 코드 또는 백업 코드를 입력하세요.
          </p>
          <Input
            id="totpCode"
            name="totpCode"
            className="mt-2 h-10"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Two-factor authentication code"
          />
        </details>

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? loadingLabel : submitLabel}
        </Button>
      </form>

      {googleEnabled ? (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>
      ) : null}

      {googleEnabled ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={() => void onGoogle()}
          disabled={loading}
        >
          {googleLabel}
        </Button>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {noAccount}{" "}
        <Link
          href={signupHrefWithParams}
          className="font-medium text-primary hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
