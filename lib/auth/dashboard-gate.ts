import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import {
  findUserById,
  type UserByClerkRow,
} from "@/lib/auth/find-user-by-clerk";
import { getLocalizedPath, getLoginPath } from "@/lib/auth/paths";

/**
 * 광고주 전용 라우트. NextAuth `getServerSession` + DB 역할 검증.
 * ADMIN은 관리자 콘솔과 별도로 광고주 화면(추천·캠페인 등)을 열어볼 수 있게 허용한다.
 */
export async function gateAdvertiserDashboard(): Promise<UserByClerkRow> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(await getLoginPath());

  const row = await findUserById(session.user.id);
  if (!row) redirect(await getLoginPath());

  if (row.role === UserRole.MEDIA_OWNER) {
    redirect(await getLocalizedPath("/dashboard/media-owner"));
  }
  if (row.role === UserRole.ADVERTISER || row.role === UserRole.ADMIN) {
    return row;
  }
  redirect(await getLocalizedPath("/"));
}

/**
 * 매체사 전용 라우트.
 */
export async function gateMediaOwnerDashboard(): Promise<UserByClerkRow> {
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

/**
 * 관리자 전용 라우트 (예: /admin/medias).
 */
export async function gateAdminDashboard(): Promise<UserByClerkRow> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(await getLoginPath());

  const row = await findUserById(session.user.id);
  if (!row) redirect(await getLoginPath());

  if (row.role !== UserRole.ADMIN) {
    redirect(await getLocalizedPath("/"));
  }

  return row;
}
