import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function assertInquiryThreadAccess(
  inquiryId: string,
  userId: string,
  role: UserRole,
) {
  const inq = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: { media: { select: { createdById: true } } },
  });
  if (!inq) return null;
  if (role === UserRole.ADVERTISER && inq.advertiserId === userId) return inq;
  if (role === UserRole.MEDIA_OWNER && inq.media.createdById === userId) return inq;
  return null;
}
