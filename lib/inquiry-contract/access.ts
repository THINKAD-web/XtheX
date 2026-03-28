import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function loadInquiryForContractApi(inquiryId: string) {
  return prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      contract: true,
      advertiser: { select: { id: true, email: true } },
      media: {
        select: {
          id: true,
          mediaName: true,
          category: true,
          price: true,
          locationJson: true,
          createdById: true,
          createdBy: { select: { email: true } },
        },
      },
    },
  });
}

export function assertInquiryContractParty(
  inquiry: NonNullable<Awaited<ReturnType<typeof loadInquiryForContractApi>>>,
  userId: string,
  userRole: UserRole,
) {
  const isAdvertiser = inquiry.advertiserId === userId;
  const isMediaOwner =
    inquiry.media.createdById != null && inquiry.media.createdById === userId;
  const isAdmin = userRole === UserRole.ADMIN;
  if (!isAdvertiser && !isMediaOwner && !isAdmin) {
    return { ok: false as const, error: "forbidden" as const };
  }
  return { ok: true as const, isAdvertiser, isMediaOwner, isAdmin };
}
