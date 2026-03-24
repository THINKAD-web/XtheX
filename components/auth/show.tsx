import * as React from "react";
import { getAuthSession } from "@/lib/auth/session";

type Props = {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
};

export async function Show({ when, children }: Props) {
  const session = await getAuthSession();
  const isSignedIn = !!session?.user;

  if (when === "signed-in") {
    return isSignedIn ? <>{children}</> : null;
  }

  return !isSignedIn ? <>{children}</> : null;
}

