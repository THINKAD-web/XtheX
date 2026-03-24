import { landing } from "@/lib/landing-theme";

/**
 * 고정 SiteHeader(h-14) 아래 쓰는 공통 페이지 배경.
 * 새 공개/마케팅 페이지는 `AppSiteChrome` + 이 토큰으로 통일하세요.
 */
export const appPageShellClass =
  "min-h-screen bg-gradient-to-b from-muted/30 via-background to-background text-foreground";

/** 로그인·회원가입 등 폼 카드 */
export const appContentPanelClass =
  "rounded-2xl border border-border bg-card p-8 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]";

/** 본문 가로 폭 — 헤더와 동일하게 landing.container */
export const appMainContainerClass = `${landing.container} py-12 sm:py-16 lg:py-20`;
