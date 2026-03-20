import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";

export type AppUser = {
  id: string;
  clerkId: string;
  role: UserRole;
  onboardingCompleted: boolean;
  email: string;
  name: string | null;
};

/**
 * 현재 요청의 Clerk 세션과 연동된 Prisma User를 가져옵니다.
 * 세션이 없거나 DB에 유저가 없으면 null을 반환합니다.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const dbUser = await findUserByClerkId(userId);
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    clerkId: dbUser.clerkId,
    role: dbUser.role,
    onboardingCompleted: dbUser.onboardingCompleted,
    email: dbUser.email,
    name: dbUser.name,
  };
}

/**
 * 지정된 Role을 요구합니다.
 * - 세션이 없거나 DB User가 없으면 /sign-in 으로 redirect
 * - Role이 맞지 않으면 /sign-in 으로 redirect (추후 /forbidden 등으로 변경 가능)
 *
 * 사용 예시 (Server Component / Route Handler):
 *
 *   import { requireRole, isAdmin } from "@/lib/auth/rbac";
 *
 *   export default async function AdminPage() {
 *     const user = await requireRole("ADMIN");
 *     // user.role === "ADMIN" 이 보장됩니다.
 *   }
 */
export async function requireRole(role: UserRole): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== role) redirect("/sign-in");
  return user;
}

/** 매체사 (구 PARTNER) */
export async function isMediaOwner(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.MEDIA_OWNER;
}

/** 광고주 (구 BRAND) */
export async function isAdvertiser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.ADVERTISER;
}

export async function isPartner(): Promise<boolean> {
  return isMediaOwner();
}

export async function isBrand(): Promise<boolean> {
  return isAdvertiser();
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.ADMIN;
}

