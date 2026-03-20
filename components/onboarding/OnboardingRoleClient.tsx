"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Radio, Loader2 } from "lucide-react";

export function OnboardingRoleClient() {
  const router = useRouter();
  const [loading, setLoading] = React.useState<"adv" | "media" | null>(null);

  const choose = async (role: "ADVERTISER" | "MEDIA_OWNER") => {
    setLoading(role === "ADVERTISER" ? "adv" : "media");
    try {
      const res = await fetch("/api/onboarding/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) return;
      const flow = role === "ADVERTISER" ? "advertiser" : "media";
      router.push(`/onboarding/wizard?flow=${flow}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-20 text-center lg:py-32">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl lg:text-5xl">
          XtheX와 함께 세계를 연결하세요
        </h1>
        <p className="mx-auto max-w-xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
          광고주이신가요? 매체사이신가요? 아래에서 선택해 주세요.
        </p>
      </header>

      <div className="grid w-full gap-8 sm:grid-cols-2">
        <Card
          className="cursor-pointer rounded-2xl border border-border/50 shadow-xl transition-all hover:shadow-2xl"
          onClick={() => !loading && choose("ADVERTISER")}
        >
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400">
              <Megaphone className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">광고주</CardTitle>
            <p className="text-sm font-normal leading-relaxed text-zinc-600 dark:text-zinc-400">
              캠페인 등록 · 미디어 믹스로 최적 매체 조합 찾기
            </p>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-blue-600 font-medium hover:bg-blue-700"
              disabled={loading !== null}
              onClick={(e) => {
                e.stopPropagation();
                choose("ADVERTISER");
              }}
            >
              {loading === "adv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "광고주로 시작"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer rounded-2xl border border-border/50 shadow-xl transition-all hover:shadow-2xl"
          onClick={() => !loading && choose("MEDIA_OWNER")}
        >
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/25 dark:text-cyan-400">
              <Radio className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">매체사</CardTitle>
            <p className="text-sm font-normal leading-relaxed text-zinc-600 dark:text-zinc-400">
              제안서 업로드 · AI로 매체 등록 및 노출
            </p>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-cyan-600 font-medium hover:bg-cyan-700"
              disabled={loading !== null}
              onClick={(e) => {
                e.stopPropagation();
                choose("MEDIA_OWNER");
              }}
            >
              {loading === "media" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "매체사로 시작"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
