import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/rbac";
import { OnboardingRoleClient } from "@/components/onboarding/OnboardingRoleClient";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";

export const runtime = "nodejs";

export default async function OnboardingRolePage() {
  const user = await getCurrentUser();
  if (user?.onboardingCompleted) {
    if (user.role === UserRole.MEDIA_OWNER) {
      redirect("/dashboard/media-owner");
    }
    if (user.role === UserRole.ADVERTISER) {
      redirect("/dashboard/advertiser");
    }
    if (user.role === UserRole.ADMIN) {
      redirect("/admin");
    }
    redirect("/");
  }
  return (
    <AppSiteChrome mainClassName="min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-950 dark:to-zinc-900">
      <OnboardingRoleClient />
    </AppSiteChrome>
  );
}
