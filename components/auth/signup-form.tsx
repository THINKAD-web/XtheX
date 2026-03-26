"use client";

import * as React from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  postAuthRedirectPath,
  safeInternalCallbackUrl,
} from "@/lib/auth/post-auth-redirect";

const ROLES = ["ADVERTISER", "MEDIA_OWNER"] as const;

type Props = {
  loginHref: string;
  title: string;
  nameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  roleLabel: string;
  roleAdvertiser: string;
  roleMediaOwner: string;
  submitLabel: string;
  loadingLabel: string;
  hasAccount: string;
};

export function SignupForm({
  loginHref,
  title,
  nameLabel,
  emailLabel,
  passwordLabel,
  roleLabel,
  roleAdvertiser,
  roleMediaOwner,
  submitLabel,
  loadingLabel,
  hasAccount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramRole = searchParams.get("role")?.toUpperCase();
  const callbackUrlParam = searchParams.get("callbackUrl");
  const safeAfterAuth = safeInternalCallbackUrl(callbackUrlParam);
  const initialRole =
    paramRole === "MEDIA_OWNER" || paramRole === "ADVERTISER"
      ? paramRole
      : "ADVERTISER";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<(typeof ROLES)[number]>(initialRole);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loginHrefWithParams = React.useMemo(() => {
    const sp = new URLSearchParams();
    const role = searchParams.get("role");
    const cb = searchParams.get("callbackUrl");
    if (role) sp.set("role", role);
    if (cb) sp.set("callbackUrl", cb);
    const q = sp.toString();
    return q ? `${loginHref}?${q}` : loginHref;
  }, [searchParams, loginHref]);

  React.useEffect(() => {
    if (paramRole === "MEDIA_OWNER" || paramRole === "ADVERTISER") {
      setRole(paramRole);
    }
  }, [paramRole]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string | Record<string, unknown>;
      };
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "가입에 실패했습니다. 입력값을 확인해 주세요.";
        setError(msg);
        return;
      }

      const sign = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });
      if (sign?.error) {
        setError("가입은 완료되었습니다. 로그인 페이지에서 로그인해 주세요.");
        return;
      }
      const session = await getSession();
      const dest =
        safeAfterAuth ?? postAuthRedirectPath(session?.user?.role);
      router.push(dest);
      router.refresh();
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <p
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            {nameLabel}
          </label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
        </div>
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
            className="h-11"
          />
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">{roleLabel}</legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="role"
                value="ADVERTISER"
                checked={role === "ADVERTISER"}
                onChange={() => setRole("ADVERTISER")}
                className="text-primary"
              />
              <span className="text-sm">{roleAdvertiser}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="role"
                value="MEDIA_OWNER"
                checked={role === "MEDIA_OWNER"}
                onChange={() => setRole("MEDIA_OWNER")}
                className="text-primary"
              />
              <span className="text-sm">{roleMediaOwner}</span>
            </label>
          </div>
        </fieldset>

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? loadingLabel : submitLabel}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {hasAccount}{" "}
        <Link
          href={loginHrefWithParams}
          className="font-medium text-primary hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
