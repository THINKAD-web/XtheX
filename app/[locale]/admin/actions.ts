"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ProposalStatus, Role } from "@prisma/client";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  // TEMP: 개발 단계에서는 role 체크를 완화해서,
  // DB에 존재하기만 하면 admin 권한을 허용한다.
  if (!dbUser) throw new Error("Forbidden");
  return dbUser;
}

export async function adminApproveProposal(proposalId: string) {
  await requireAdmin();

  await prisma.$transaction([
    prisma.mediaProposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.APPROVED },
    }),
    prisma.reviewLog.create({
      data: {
        proposalId,
        reviewerId: null,
        decision: ProposalStatus.APPROVED,
        comment: "Manually approved by admin.",
        aiScore: null,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/explore");
}

export async function adminRejectProposal(proposalId: string) {
  await requireAdmin();

  await prisma.$transaction([
    prisma.mediaProposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.REJECTED },
    }),
    prisma.reviewLog.create({
      data: {
        proposalId,
        reviewerId: null,
        decision: ProposalStatus.REJECTED,
        comment: "Manually rejected by admin.",
        aiScore: null,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/explore");
}

