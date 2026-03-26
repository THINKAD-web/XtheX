import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { getAuthSession } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const dbUser = await findUserById(session.user.id);
  if (!dbUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const proposal = await prisma.mediaProposal.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = proposal.userId === dbUser.id;
  const isAdmin = dbUser.role === UserRole.ADMIN;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { reviewProposalById } = await import("@/lib/ai/reviewProposal");
    const result = await reviewProposalById(id);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Review failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

