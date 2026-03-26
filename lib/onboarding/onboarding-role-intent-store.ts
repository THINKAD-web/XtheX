import { create } from "zustand";
import {
  clearPendingOnboardingRole,
  readPendingOnboardingRole,
  writePendingOnboardingRole,
  type OnboardingRoleChoice,
} from "@/lib/onboarding/pending-role";

type State = {
  /** sessionStorage와 동기화되는 선택 역할 (비로그인 → 로그인 플로우) */
  pendingRole: OnboardingRoleChoice | null;
  setPendingRole: (role: OnboardingRoleChoice) => void;
  clearPendingRole: () => void;
  hydrateFromSessionStorage: () => void;
};

/**
 * 온보딩 역할 선택 의도.
 * - Zustand로 컴포넌트 간 공유 + sessionStorage에 영속(탭 단위).
 * - React Context 대신 전역 스토어를 쓰면 Provider 없이 동일 탭 어디서든 읽기 가능합니다.
 *   Context가 필요하면 이 스토어를 구독하는 Provider를 얇게 감싸도 됩니다.
 */
export const useOnboardingRoleIntent = create<State>((set) => ({
  pendingRole: null,
  setPendingRole: (role) => {
    writePendingOnboardingRole(role);
    set({ pendingRole: role });
  },
  clearPendingRole: () => {
    clearPendingOnboardingRole();
    set({ pendingRole: null });
  },
  hydrateFromSessionStorage: () => {
    const r = readPendingOnboardingRole();
    set({ pendingRole: r });
  },
}));
