import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/rbac";
import { OnboardingRoleClient } from "@/components/onboarding/OnboardingRoleClient";

export const runtime = "nodejs";

export default async function OnboardingRolePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.onboardingCompleted) {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-950 dark:to-zinc-900">
      <OnboardingRoleClient />
    </div>
  );
}
