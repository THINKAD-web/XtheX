"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { UserMenu } from "@/components/auth/user-menu";

type Props = {
  signInLabel: string;
  signUpLabel: string;
};

export function AuthNav({ signInLabel, signUpLabel }: Props) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div
        className="h-11 w-40 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80"
        aria-hidden
      />
    );
  }

  if (status === "authenticated") {
    return <UserMenu />;
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {signInLabel}
      </Link>
      <Link
        href="/signup"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {signUpLabel}
      </Link>
    </>
  );
}
