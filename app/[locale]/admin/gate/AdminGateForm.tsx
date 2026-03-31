"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminGateForm() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/admin`;

  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/site-gate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Unauthorized");
        return;
      }
      const target =
        callbackUrl.startsWith("/") ? callbackUrl : `/${locale}/admin`;
      window.location.assign(target);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the site password to open the admin area. Your session lasts 7 days on this device.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-gate-pw">Password</Label>
          <Input
            id="admin-gate-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "…" : "Continue"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/admin" className="underline underline-offset-4">
          Back to admin home
        </Link>
      </p>
    </div>
  );
}
