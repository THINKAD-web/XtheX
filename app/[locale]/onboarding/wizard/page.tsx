import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/rbac";
import { OnboardingWizardClient } from "@/components/onboarding/OnboardingWizardClient";

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
    redirect("/");
  }
  const sp = await searchParams;
  const flow = sp.flow === "media" ? "media" : "advertiser";
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-950 dark:to-zinc-900">
      <OnboardingWizardClient flow={flow} />
    </div>
  );
}
