import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { getLocalizedPath, getLoginPath } from "@/lib/auth/paths";

type GateUser = NonNullable<Awaited<ReturnType<typeof findUserById>>>;

/**
 * 광고주 전용 라우트. NextAuth `getServerSession` + DB 역할 검증.
 */
export async function gateAdvertiserDashboard(): Promise<GateUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(await getLoginPath());

  const row = await findUserById(session.user.id);
  if (!row) redirect(await getLoginPath());

  if (row.role === UserRole.MEDIA_OWNER) {
    redirect(await getLocalizedPath("/dashboard/media-owner"));
  }
  if (row.role === UserRole.ADMIN) redirect(await getLocalizedPath("/admin"));
  if (row.role !== UserRole.ADVERTISER) redirect(await getLocalizedPath("/"));

  return row;
}

/**
 * 매체사 전용 라우트.
 */
export async function gateMediaOwnerDashboard(): Promise<GateUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(await getLoginPath());

  const row = await findUserById(session.user.id);
  if (!row) redirect(await getLoginPath());

  if (row.role === UserRole.ADVERTISER) {
    redirect(await getLocalizedPath("/dashboard/advertiser"));
  }
  if (row.role === UserRole.ADMIN) redirect(await getLocalizedPath("/admin"));
  if (row.role !== UserRole.MEDIA_OWNER) redirect(await getLocalizedPath("/"));

  return row;
}
