import type { ReactNode } from "react";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { DashboardSidebarLayout } from "@/components/dashboard/DashboardSidebarLayout";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaOwnerLayout({ children }: { children: ReactNode }) {
  await gateMediaOwnerDashboard();

  return (
    <DashboardChrome>
      <DashboardSidebarLayout role="MEDIA_OWNER">{children}</DashboardSidebarLayout>
    </DashboardChrome>
  );
}

