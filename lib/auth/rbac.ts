import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { getAuthSession } from "@/lib/auth/session";
import { getLoginPath } from "@/lib/auth/paths";

export type AppUser = {
  id: string;
  clerkId: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
  email: string;
  name: string | null;
  createdAt: Date;
};

/**
 * NextAuth 세션과 연동된 Prisma User를 가져옵니다.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getAuthSession();
  const id = session?.user?.id;
  if (!id) return null;

  const dbUser = await findUserById(id);
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    clerkId: dbUser.clerkId,
    role: dbUser.role,
    onboardingCompleted: dbUser.onboardingCompleted,
    email: dbUser.email,
    name: dbUser.name,
    createdAt: dbUser.createdAt,
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
  if (!user) redirect(await getLoginPath());
  if (user.role !== role) redirect(await getLoginPath());
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

