"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { postAuthRedirectPath } from "@/lib/auth/post-auth-redirect";
import type { UserRole } from "@prisma/client";

type Props = {
  mediaLabel: string;
  advertiserLabel: string;
  mediaClassName: string;
  advertiserClassName: string;
  /** Extra classes for the flex wrapper */
  className?: string;
  /** 비로그인 상태에서 매체사 가입 CTA 클릭 시 (A/B 전환 측정 등) */
  onGuestMediaClick?: () => void;
  /** 비로그인 상태에서 광고주 가입 CTA 클릭 시 */
  onGuestAdvertiserClick?: () => void;
};

function roleHref(role: UserRole): string {
  if (role === "ADMIN") return "/admin";
  if (role === "MEDIA_OWNER") return "/dashboard/media-owner";
  return postAuthRedirectPath(role);
}

/**
 * Hero / footer role CTAs.
 * - 비로그인: 매체사·광고주 회원가입
 * - 로그인: 역할별 대시보드 (광고주는 AI 추천 페이지 링크 포함)
 */
export function HomeRoleCtas({
  mediaLabel,
  advertiserLabel,
  mediaClassName,
  advertiserClassName,
  className,
  onGuestMediaClick,
  onGuestAdvertiserClick,
}: Props) {
  const { data: session, status } = useSession();
  const t = useTranslations("home.hero");
  const role = session?.user?.role as UserRole | undefined;

  const wrap = (children: ReactNode) => (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-stretch justify-center gap-4 transition-opacity duration-300 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center",
        className,
      )}
    >
      {children}
    </div>
  );

  if (status === "loading") {
    return wrap(
      <>
        <div
          className="h-11 min-w-[200px] animate-pulse rounded-lg bg-zinc-300/80 dark:bg-zinc-600/80"
          aria-hidden
        />
        <div
          className="h-11 min-w-[200px] animate-pulse rounded-lg bg-zinc-300/60 dark:bg-zinc-600/60"
          aria-hidden
        />
      </>,
    );
  }

  if (status === "authenticated" && role) {
    if (role === "ADMIN") {
      return wrap(
        <Link href="/admin" className={cn(mediaClassName, "justify-center text-center")}>
          {t("admin_console")}
        </Link>,
      );
    }

    if (role === "ADVERTISER") {
      return wrap(
        <>
          <Link
            href={roleHref(role)}
            className={cn(mediaClassName, "justify-center text-center")}
          >
            {t("dashboard_go")}
          </Link>
          <Link
            href="/dashboard/advertiser/recommend"
            className={cn(advertiserClassName, "justify-center text-center")}
          >
            {t("ai_recommend_go")}
          </Link>
        </>,
      );
    }

    if (role === "MEDIA_OWNER") {
      return wrap(
        <Link
          href="/dashboard/media-owner"
          className={cn(mediaClassName, "justify-center text-center")}
        >
          {t("dashboard_go")}
        </Link>,
      );
    }
  }

  return wrap(
    <>
      <Link
        href="/signup?role=MEDIA_OWNER"
        className={cn(mediaClassName, "justify-center text-center")}
        onClick={() => onGuestMediaClick?.()}
      >
        {mediaLabel}
      </Link>
      <Link
        href="/signup?role=ADVERTISER"
        className={cn(advertiserClassName, "justify-center text-center")}
        onClick={() => onGuestAdvertiserClick?.()}
      >
        {advertiserLabel}
      </Link>
    </>,
  );
}
