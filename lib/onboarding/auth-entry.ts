import type { OnboardingRoleChoice } from "@/lib/onboarding/pending-role";

/** 온보딩 카드 선택 후 로그인/가입으로 보낼 때 사용하는 상대 경로 (next-intl 라우터가 로케일 접두사 처리) */
export function getLoginUrlForOnboardingRole(role: OnboardingRoleChoice): string {
  const flow = role === "MEDIA_OWNER" ? "media" : "advertiser";
  const callbackUrl = `/onboarding/wizard?flow=${flow}`;
  const sp = new URLSearchParams();
  sp.set("role", role);
  sp.set("callbackUrl", callbackUrl);
  return `/login?${sp.toString()}`;
}
