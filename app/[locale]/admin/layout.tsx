import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/site-footer";
import { getAuthSession } from "@/lib/auth/session";
import { ensureAdminUserFromSession } from "@/lib/auth/ensure-admin-from-session";

type Props = { children: React.ReactNode };

/**
 * `/admin` 진입 시 `NEXTAUTH_ADMIN_EMAILS`에 해당하면 DB 역할을 ADMIN으로 올림
 * (이미 가입된 계정도 동일 이메일이면 통과 가능).
 */
export default async function AdminLayout({ children }: Props) {
  const session = await getAuthSession();
  if (session?.user) {
    await ensureAdminUserFromSession();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex-1 pt-14">{children}</div>
      <SiteFooter />
    </div>
  );
}
