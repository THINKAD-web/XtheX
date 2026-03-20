/**
 * Clerk에 로그인된 사용자를 DB에 ADMIN으로 등록합니다.
 * /admin 접속 시 DB에 사용자가 없을 때 한 번 호출해 사용.
 */
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { findUserByClerkId } from "./find-user-by-clerk";

/**
 * 현재 Clerk 세션 사용자를 DB에 ADMIN으로 upsert.
 * 이미 있으면 role만 ADMIN으로 업데이트.
 * 반환: DB User 또는 null (Clerk 세션 없으면).
 */
export async function ensureAdminUserFromClerk(): Promise<Awaited<ReturnType<typeof findUserByClerkId>> | null> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) return null;

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ??
    (clerkUser.primaryEmailAddress?.emailAddress as string | undefined) ??
    `admin_${clerkUser.id.slice(0, 8)}@xthex.local`;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    null;

  const prisma = getPrisma();
  await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { role: UserRole.ADMIN, onboardingCompleted: true, email, name },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      role: UserRole.ADMIN,
      onboardingCompleted: true,
    },
  });

  return findUserByClerkId(clerkUser.id);
}
