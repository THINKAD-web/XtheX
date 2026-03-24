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

type Props = {
  signupHref: string;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });
      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      const session = await getSession();
      const role = session?.user?.role;
      const cb = safeInternalCallbackUrl(searchParams.get("callbackUrl"));
      const target = cb ?? postAuthRedirectPath(role);
      router.push(target);
      router.refresh();
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>

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
        <Link href={signupHref} className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
