import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewProposalById } from "@/lib/ai/reviewProposal";
import { Role } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const proposal = await prisma.mediaProposal.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = proposal.userId === dbUser.id;
  const isAdmin = dbUser.role === Role.ADMIN;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await reviewProposalById(id);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Review failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

