/**
 * Bootstrap ADMIN role only for emails listed in NEXTAUTH_ADMIN_EMAILS (comma-separated).
 */
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";

function adminEmailAllowlist(): string[] {
  return (
    process.env.NEXTAUTH_ADMIN_EMAILS?.split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

export async function ensureAdminUserFromSession() {
  const session = await getAuthSession();
  const su = session?.user;
  const email = su?.email?.trim().toLowerCase();
  if (!email || !su) return null;

  const allow = adminEmailAllowlist();
  if (!allow.length || !allow.includes(email)) return null;

  const name = su.name ?? null;
  const id = su.id;

  await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      onboardingCompleted: true,
      ...(name ? { name } : {}),
    },
    create: {
      email,
      name,
      role: UserRole.ADMIN,
      onboardingCompleted: true,
    },
  });

  if (id) {
    const u = await findUserById(id);
    if (u) return u;
  }
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      clerkId: true,
      role: true,
      onboardingCompleted: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
