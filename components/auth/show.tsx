import * as React from "react";
import { auth } from "@clerk/nextjs/server";

type Props = {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
};

export async function Show({ when, children }: Props) {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  if (when === "signed-in") {
    return isSignedIn ? <>{children}</> : null;
  }

  return !isSignedIn ? <>{children}</> : null;
}

