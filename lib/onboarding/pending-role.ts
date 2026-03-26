/**
 * 온보딩에서 선택한 역할을 로그인/회원가입 직후까지 유지합니다.
 * (OAuth 등 세션에 역할이 아직 반영되지 않은 경우 `/api/onboarding/role`로 동기화할 때 사용)
 */
export const PENDING_ONBOARDING_ROLE_STORAGE_KEY =
  "xthex_pending_onboarding_role_v1";

export type OnboardingRoleChoice = "ADVERTISER" | "MEDIA_OWNER";

export function readPendingOnboardingRole(): OnboardingRoleChoice | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_ONBOARDING_ROLE_STORAGE_KEY);
  if (raw === "ADVERTISER" || raw === "MEDIA_OWNER") return raw;
  return null;
}

export function writePendingOnboardingRole(role: OnboardingRoleChoice) {
  sessionStorage.setItem(PENDING_ONBOARDING_ROLE_STORAGE_KEY, role);
}

export function clearPendingOnboardingRole() {
  sessionStorage.removeItem(PENDING_ONBOARDING_ROLE_STORAGE_KEY);
}
