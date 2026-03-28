import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { DashboardSidebarLayout } from "@/components/dashboard/DashboardSidebarLayout";
import { gateDashboardNotifications } from "@/lib/auth/dashboard-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NotificationsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await gateDashboardNotifications();
  const role =
    user.role === UserRole.MEDIA_OWNER ? "MEDIA_OWNER" : "ADVERTISER";

  return (
    <DashboardChrome>
      <DashboardSidebarLayout role={role}>{children}</DashboardSidebarLayout>
    </DashboardChrome>
  );
}
