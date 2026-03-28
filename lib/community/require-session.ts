import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";

export async function requireCommunitySession(): Promise<
  { userId: string } | NextResponse
> {
  const session = await getAuthSession();
  const userId =
    session?.user && "id" in session.user && typeof session.user.id === "string"
      ? session.user.id
      : null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return { userId };
}
