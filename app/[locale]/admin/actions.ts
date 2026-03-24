"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { ProposalStatus, UserRole } from "@prisma/client";

async function requireAdmin() {
  const dbUser = await getCurrentUser();
  if (!dbUser) throw new Error("Unauthorized");
  if (dbUser.role !== UserRole.ADMIN) throw new Error("Forbidden");
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

