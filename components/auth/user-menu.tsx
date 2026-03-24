"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { data } = useSession();
  if (!data?.user) return null;
  return (
    <div className="flex max-w-[min(100%,18rem)] items-center gap-2">
      <span className="truncate text-sm text-muted-foreground">
        {data.user.name ?? data.user.email}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        로그아웃
      </Button>
    </div>
  );
}
