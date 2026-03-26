import type { ReactNode } from "react";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { DashboardSidebarLayout } from "@/components/dashboard/DashboardSidebarLayout";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdvertiserLayout({ children }: { children: ReactNode }) {
  const user = await gateAdvertiserDashboard();
  const role = user.role === UserRole.ADMIN ? "ADVERTISER" : "ADVERTISER";

  return (
    <DashboardChrome>
      <DashboardSidebarLayout role={role}>{children}</DashboardSidebarLayout>
    </DashboardChrome>
  );
}

