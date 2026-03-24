"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  mediaLabel: string;
  advertiserLabel: string;
  mediaSignedInHref: string;
  advertiserSignedInHref: string;
  mediaClassName: string;
  advertiserClassName: string;
};

/**
 * 매체사 CTA → 비로그인 시 MEDIA_OWNER 회원가입, 로그인 후 매체 대시보드.
 * 광고주 CTA → 비로그인 시 ADVERTISER 회원가입, 로그인 후 탐색 등.
 */
export function HomeRoleCtas({
  mediaLabel,
  advertiserLabel,
  mediaSignedInHref,
  advertiserSignedInHref,
  mediaClassName,
  advertiserClassName,
}: Props) {
  const { status } = useSession();
  const authed = status === "authenticated";

  const mediaHref = authed ? mediaSignedInHref : "/signup?role=MEDIA_OWNER";
  const advertiserHref = authed
    ? advertiserSignedInHref
    : "/signup?role=ADVERTISER";

  return (
    <div className="flex w-full max-w-md flex-col items-stretch justify-center gap-4 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
      <Link href={mediaHref} className={cn(mediaClassName)}>
        {mediaLabel}
      </Link>
      <Link href={advertiserHref} className={cn(advertiserClassName)}>
        {advertiserLabel}
      </Link>
    </div>
  );
}
