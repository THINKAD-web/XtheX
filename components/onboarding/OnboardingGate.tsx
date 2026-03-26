"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";

function isOnboardingPath(path: string | null): boolean {
  if (!path) return false;
  return (
    path.includes("/onboarding") ||
    path.includes("/sign-in") ||
    path.includes("/sign-up") ||
    path.includes("/login") ||
    path.includes("/signup")
  );
}

/** middleware + 서버 게이트로 보호되므로 UI를 스피너 뒤에 숨기지 않음 */
function isDashboardPath(path: string | null): boolean {
  return path != null && path.startsWith("/dashboard");
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const isLoaded = status !== "loading";
  const isSignedIn = status === "authenticated";
  const pathname = usePathname();
  const router = useRouter();
  const [showApp, setShowApp] = React.useState(false);

  React.useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setShowApp(true);
      return;
    }

    if (isOnboardingPath(pathname)) {
      setShowApp(true);
      return;
    }

    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("xthex_onboarding_ok") === "1") {
        setShowApp(true);
        return;
      }
    }

    let cancelled = false;

    if (pathname != null && isDashboardPath(pathname)) {
      setShowApp(true);
      (async () => {
        try {
          const res = await fetch("/api/onboarding/status", {
            credentials: "include",
          });
          const data = (await res.json()) as { completed?: boolean };
          if (cancelled) return;
          if (data.completed) {
            sessionStorage.setItem("xthex_onboarding_ok", "1");
          } else {
            router.replace("/onboarding/role");
          }
        } catch {
          /* 온보딩 API 실패 시 대시보드 유지 (서버 게이트가 이미 통과) */
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const res = await fetch("/api/onboarding/status", {
          credentials: "include",
        });
        const data = (await res.json()) as { completed?: boolean };
        if (cancelled) return;
        if (data.completed) {
          sessionStorage.setItem("xthex_onboarding_ok", "1");
          setShowApp(true);
        } else {
          router.replace("/onboarding/role");
        }
      } catch {
        if (!cancelled) setShowApp(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, pathname, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (
    isSignedIn &&
    !showApp &&
    pathname &&
    !isOnboardingPath(pathname) &&
    !isDashboardPath(pathname)
  ) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">온보딩 확인 중…</p>
      </div>
    );
  }

  return <>{children}</>;
}
