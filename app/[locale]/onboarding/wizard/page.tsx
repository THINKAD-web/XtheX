import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/rbac";
import { OnboardingWizardClient } from "@/components/onboarding/OnboardingWizardClient";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";

export const runtime = "nodejs";

type Props = {
  searchParams: Promise<{ flow?: string }>;
};

export default async function OnboardingWizardPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.onboardingCompleted) {
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
  const sp = await searchParams;
  const flow = sp.flow === "media" ? "media" : "advertiser";
  return (
    <AppSiteChrome mainClassName="min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-950 dark:to-zinc-900">
      <OnboardingWizardClient flow={flow} />
    </AppSiteChrome>
  );
}
