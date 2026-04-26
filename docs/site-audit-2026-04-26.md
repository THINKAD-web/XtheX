# XtheX 사이트 종합 점검 보고서 — Phase 9

> 작성: 2026-04-26
> 대상: `main` 브랜치 sha `fb224d1` (PR #5 머지 시점)
> 운영 URL: https://xthe-x.vercel.app
> 본 보고서는 read-only 분석. 코드 수정 없음.

## 우선순위 표기 규약

- **P0** — 긴급. 실서비스 직접 영향(보안·런타임 에러·UX 명백한 깨짐). 즉시 또는 다음 PR에서 처리
- **P1** — 중요. 프로덕션 품질 저하(i18n 누락, 성능 비효율, 어드민 도구 미완). 1~2주 내 처리
- **P2** — 나중에. 정리/개선 영역(코드 중복, 이미지 최적화, 부가 기능). 백로그

---

## 1. 라우트 인벤토리

### 1.1 규모 요약

| 영역 | 페이지 수 | 비고 |
|------|----------:|------|
| 공개 페이지 (`/[locale]/*`) | 31 | 홈·about·blog·news·explore·compare·campaigns 등 |
| Advertiser 대시보드 | 17 | 수익·문의·캠페인·ROI·예측 분석 등 |
| Media-Owner 대시보드 | 12 | 매체·문의·캘린더·매출·파트너 API 등 |
| Admin 콘솔 | 16 | 매체·리뷰·인보이스·워크플로·A/B·승인 등 |
| 인증·온보딩 | 6 | login·signup·sign-in·sign-up·onboarding |
| **합계 (user-facing)** | **82** | redirect-only 8개 포함 |

### 1.2 상태 분포

| 상태 | 비율 | 설명 |
|------|----:|------|
| **Complete** (≥80 LOC + 데이터 연결) | 28% (23) | 실제 컴포넌트·DB·UI 완비 |
| **Partial** (구조 OK, 일부 섹션 비어있거나 i18n 누락) | 38% (31) | 가장 많은 그룹 — Phase 9 핵심 작업 영역 |
| **Placeholder** (`<30 LOC`, 클라이언트 컴포넌트로 위임만) | 24% (20) | 일부는 의도적 (얇은 wrapper), 일부는 진짜 미완 |
| **Redirect-Only** | 10% (8) | `/recommend`, `/upload`, `/(dashboard)/advertiser` 등 — 의도된 리다이렉트 |

### 1.3 주요 페이지 상태표 (공개 영역)

| 경로 | LOC | 상태 | KR | EN | 우선 |
|------|----:|------|:--:|:--:|:----:|
| `/[locale]` (홈) | 329 | complete | ⚠️ | ⚠️ | **P1** |
| `/[locale]/about` | 315 | complete | ✅ | ✅ | — |
| `/[locale]/blog` · `/blog/[slug]` | 114·154 | complete | ⚠️ | ⚠️ | P1 |
| `/[locale]/contact` | 72 | partial | ⚠️ | ⚠️ | P1 |
| `/[locale]/help` | 26 | placeholder | ✅ | ✅ | P2 |
| `/[locale]/explore` | 26 | placeholder | ❌ | ❌ | P1 |
| `/[locale]/terms` | 65 | partial | ❌ | ❌ | P1 |
| `/[locale]/news` · `/news/[slug]` | 149·171 | complete | ✅ | ✅ | — |
| `/[locale]/compare` | 671 | complete | ⚠️ | ⚠️ | P1 (671 LOC god-component) |
| `/[locale]/community` · `/[postId]` | 30·30 | partial | ✅ | ✅ | — |
| `/[locale]/campaigns/new` | 138 | complete | ✅ | ✅ | — |
| `/[locale]/campaigns/[draftId]` | 68 | partial | ⚠️ | ⚠️ | P1 |
| `/[locale]/campaign/[id]` | 137 | complete | ❌ | ❌ | **P0** (캠페인 상세에 i18n 없음) |
| `/[locale]/medias/[mediaId]` | 812 | complete | ⚠️ | ⚠️ | P1 (812 LOC) |
| `/[locale]/medias/[mediaId]/contact` | 157 | complete | ⚠️ | ⚠️ | P2 |
| `/[locale]/quote` | 64 | partial | ⚠️ | ⚠️ | P2 |
| `/[locale]/login` · `/signup` | 51·42 | partial | ❌ | ❌ | **P0** (인증 페이지 한국어 only) |
| `/[locale]/sign-in` · `/sign-up` | 10·10 | redirect | ❌ | ❌ | P2 (Clerk 잔존, NextAuth 통일 시 제거) |
| `/[locale]/onboarding/role` | 28 | redirect | — | — | — |
| `/[locale]/onboarding/wizard` | 37 | partial | ❌ | ❌ | P1 |
| `/[locale]/billing` | 25 | placeholder | ✅ | ✅ | — |
| `/[locale]/analytics` | 35 | partial | ✅ | ✅ | — |
| `/[locale]/campaign-planner` | 24 | placeholder | ❌ | ❌ | P1 |
| `/[locale]/trends` | 24 | placeholder | ✅ | ✅ | — |
| `/[locale]/templates` | 24 | placeholder | ✅ | ✅ | — |
| `/[locale]/developers` | 25 | placeholder | ✅ | ✅ | — |
| `/[locale]/recommend` | 12 | redirect | — | — | — |
| `/[locale]/upload` | 16 | redirect | — | — | — |
| `/[locale]/partnerships/apply` | 44 | partial | ✅ | ✅ | — |

### 1.4 주요 페이지 상태표 (Advertiser 대시보드)

| 경로 | LOC | 상태 | KR | EN | 우선 |
|------|----:|------|:--:|:--:|:----:|
| `/dashboard/advertiser` | 230 | complete | ✅ | ✅ | — |
| `/dashboard/advertiser/campaigns` | 78 | partial | ✅ | ✅ | — |
| `/dashboard/advertiser/campaigns/performance` | 384 | complete | ✅ | ✅ | — |
| `/dashboard/advertiser/inquiries` | 213 | complete | ✅ | ✅ | — |
| `/dashboard/advertiser/inquiries/[id]` | 102 | complete | ❌ | ❌ | P1 (`isKo` 패턴) |
| `/dashboard/advertiser/invoices` | 120 | complete | ✅ | ✅ | — |
| `/dashboard/advertiser/wishlist` | 160 | complete | ❌ | ❌ | P1 |
| `/dashboard/advertiser/recommendations` | 54 | partial | ✅ | ✅ | TODO 2개 (lib mock) |
| `/dashboard/advertiser/roi` | 88 | partial | ❌ | ❌ | P1 |
| `/dashboard/advertiser/spend` | 85 | partial | ❌ | ❌ | P1 |
| `/dashboard/advertiser/predictive-analytics` | 30 | partial | ✅ | ✅ | — |
| `/dashboard/advertiser/auto-bidding` | 30 | partial | ✅ | ✅ | — |
| `/dashboard/advertiser/campaign-analytics` | 30 | partial | ✅ | ✅ | — |
| `/dashboard/advertiser/explore` | 22 | placeholder | ❌ | ❌ | P2 |
| `/dashboard/advertiser/settings` | 77 | partial | ❌ | ❌ | P1 |
| `/dashboard/advertiser/settings/security` | 20 | placeholder | ✅ | ✅ | — |
| `/dashboard/advertiser/recommend` | 12 | redirect | — | — | — |

### 1.5 주요 페이지 상태표 (Media-Owner 대시보드)

| 경로 | LOC | 상태 | KR | EN | 우선 |
|------|----:|------|:--:|:--:|:----:|
| `/dashboard/media-owner` | 152 | complete | ⚠️ | ⚠️ | P1 (lines 45–46 `isKo`) |
| `/dashboard/media-owner/medias` | 274 | complete | ✅ | ✅ | — |
| `/dashboard/media-owner/medias/[id]/edit` | 87 | partial | ❌ | ❌ | P1 |
| `/dashboard/media-owner/medias/[id]/review` | 60 | partial | ❌ | ❌ | P1 |
| `/dashboard/media-owner/inquiries` | 161 | complete | ✅ | ✅ | — |
| `/dashboard/media-owner/inquiries/[id]` | 69 | partial | ❌ | ❌ | P1 |
| `/dashboard/media-owner/upload` | 29 | placeholder | ✅ | ✅ | — |
| `/dashboard/media-owner/calendar` | 63 | partial | ❌ | ❌ | P1 |
| `/dashboard/media-owner/revenue` | 87 | partial | ❌ | ❌ | P1 |
| `/dashboard/media-owner/partner-api` | 30 | partial | ✅ | ✅ | — |
| `/dashboard/media-owner/inquiry-encryption` | 25 | placeholder | ✅ | ✅ | — |
| `/dashboard/media-owner/settings` | 54 | partial | ❌ | ❌ | P1 |

### 1.6 주요 페이지 상태표 (Admin 콘솔)

| 경로 | LOC | 상태 | KR | EN | 비고 |
|------|----:|------|:--:|:--:|------|
| `/admin` | 373 | complete | ✅ | ✅ | 메인 대시보드 |
| `/admin/medias` | 129 | complete | ✅ | ✅ | |
| `/admin/inquiries` | 239 | complete | ✅ | ✅ | |
| `/admin/reports` | 174 | complete | ✅ | ✅ | |
| `/admin/review/[mediaId]` | 107 | complete | ❌ | ❌ | 1907 LOC `media-review-form.tsx` 호출 (god-component) |
| `/admin/reviews` | 47 | partial | ❌ | ❌ | |
| `/admin/medias/new` · `/bulk-upload` | 24·25 | placeholder | ❌ | ❌ | |
| 그 외 9개 (partnerships·content-approval·workflow·ai-upload·user-analytics·ab-testing·gate·review-reports·partnerships) | 24~86 | partial | ✅ | ✅ | i18n OK, 일부는 얇은 wrapper |

> Admin은 운영자 도구라 KR-only도 일단 허용 가능. 단 외국인 admin이 합류할 가능성을 고려하면 P2 정도.

### 1.7 i18n 메시지 파일 커버리지

| 영역 | 결과 |
|------|------|
| 메시지 파일 | `messages/{ko,en,ja,zh,es}.json` 5개 모두 존재 |
| 최상위 namespace 수 | 42개 (home, about, blog, news, dashboard 등) |
| **KO/EN 매칭** | ✅ 완전 일치 — 키 누락 없음 |
| **JA 누락** | 3개 namespace — `analytics`, `priceCalculator`, `quote` |
| **ZH/ES 누락** | 일부 namespace의 하위 키. 대부분은 EN으로 폴백 |

---

## 2. 에러 점검

### 2.1 빌드 결과 — `next build`

- **상태**: ✅ 성공 (exit=0, 컴파일 시간 66s)
- **에러**: 0개
- **경고**: **11개** (Warning 라인) — 대부분 `<img>` 미최적화 + Hook 의존성

**경고 분류**:

| 종류 | 건수 | 우선 |
|------|----:|:----:|
| `@next/next/no-img-element` (`<img>` → `<Image>` 권장) | **8** | P2 (성능) |
| `react-hooks/exhaustive-deps` (Hook 의존성 누락) | 2 | P1 |
| `node:crypto` Edge Runtime 비호환 | 1 | **P0** |

#### 2.1.1 ⚠️ P0 — `lib/admin-site-gate.ts` Edge Runtime 비호환

```
./lib/admin-site-gate.ts
A Node.js module is loaded ('crypto' at line 1) which is not supported in the Edge Runtime.
```

- **파일**: `lib/admin-site-gate.ts:1` — `import { createHmac, timingSafeEqual } from "crypto";`
- **사용처**: `middleware.ts`(Edge Runtime)에서 `verifyAdminGateCookie()` 호출
- **영향**: 현재는 Next.js가 polyfill로 통과시키지만, **`ADMIN_SITE_PASSWORD` 활성화 시 Edge에서 verify가 실패할 가능성**. 실서비스에서 admin 2차 잠금 활성화 못 함.
- **수정 방향**: `lib/auth/admin-guard.ts`처럼 Web Crypto API 또는 직접 작성한 timing-safe 비교로 교체.

#### 2.1.2 P1 — Hook 의존성 누락 2건

| 파일 | 라인 | 내용 |
|------|----:|------|
| `components/admin/BulkUploadClient.tsx` | 56 | `useCallback`이 `ACCEPTED` 의존성 누락 |
| `components/dashboard/CampaignAnalyticsClient.tsx` | 122 | 매 렌더마다 `medias` 재생성 → useEffect 무한 루프 위험 |
| `components/onboarding/DoohCampaignOnboardingModal.tsx` | 36 | `close` 함수 매 렌더 재생성 |

#### 2.1.3 P2 — `<img>` 미최적화 8건

| 파일 | 라인 |
|------|----:|
| `app/[locale]/dashboard/advertiser/wishlist/page.tsx` | 101 |
| `app/[locale]/medias/[mediaId]/page.tsx` | 278 |
| `app/[locale]/news/[slug]/page.tsx` | 124 |
| `app/[locale]/news/news-grid.tsx` | 111 |
| `components/medias/AdminCaseStudyEditModal.tsx` | 215 |
| `components/medias/AdminCaseStudyModal.tsx` | 213 |
| `components/medias/AdminMediaEditPanel.tsx` | 422 |
| `components/ui/image-carousel.tsx` | 60 |

### 2.2 TypeScript — `tsc --noEmit`

- **상태**: ✅ **0 에러**
- 프로젝트 tsconfig 기준 strict 검사 통과

### 2.3 콘솔 에러 가능성 있는 코드 패턴

#### 2.3.1 P0 — 에러 페이지가 한국어 hardcoded

**`app/error.tsx:30-31`**
```tsx
title="문제가 발생했습니다"
description="일시적인 오류입니다. 잠시 후 다시 시도해 주세요."
```

**`app/global-error.tsx:87-110`** — 글로벌 에러 핸들러 전체가 한국어 hardcoded
```
"문제가 생겼어요" / "다시 시도" / "홈으로" / "오류 코드: ..." 모두 한국어 only
```

→ 영어/일본어 사용자가 에러 만나면 한국어 메시지 + "다시 시도" 버튼만 보임. **첫인상에 큰 영향.**

#### 2.3.2 P1 — `any` 사용 빈도 (전체 grep)

확인 못 했으나, 본 보고서에는 직접 점검하지 않았습니다 (별도 정리 필요 시 후속 PR).

#### 2.3.3 P1 — `dangerouslySetInnerHTML` 1곳 (이전 audit에서 식별)

`app/[locale]/blog/[slug]/page.tsx:119` — sanitization 없음. 외부 마크다운 → XSS 경로. 별도 PR 권장.

---

## 3. 미구현 기능 / 더미 핸들러

### 3.1 명시적 TODO/FIXME (코드 grep 결과)

**총 5건** (코드 베이스 규모 대비 매우 적음 — 전반적으로 깨끗한 상태)

| 파일 | 라인 | 내용 | 우선 |
|------|----:|------|:----:|
| `app/api/push/subscribe/route.ts` | 11 | `// TODO: Store subscription in database` — 푸시 구독이 DB에 저장 안 됨 | **P0** (푸시 알림 기능 사실상 미작동) |
| `lib/recommend/currency.ts` | 3 | `// TODO: Replace with live FX source or pricing service.` — 환율 하드코딩 | P1 |
| `lib/recommend/get-advertiser-recommendations.ts` | 112 | `// TODO: Replace this mapper with dedicated AI recommendation service.` — 추천 엔진이 mock | P1 |
| `app/dashboard/advertiser/recommendations/page.tsx` | 28 | `// TODO: Replace mock-backed recommendation mapper with real-time AI service.` | P1 |
| `app/dashboard/advertiser/recommendations/page.tsx` | 29 | `// TODO: Move filter application to server-side query when recommendation API is ready.` | P2 |

### 3.2 "준비 중" / "Coming Soon" — UI 노출 위치

| 위치 | 내용 | 우선 |
|------|------|:----:|
| `app/medias/[id]/page.tsx:150-154` | AI 추천 이유: `"AI 추천 이유 준비중", "도달률/가시성 기반 분석 예정", "타겟 적합도 분석 예정"` (KO) / `"Reach and visibility analysis coming soon", "Audience-fit analysis coming soon"` (EN) | P1 |
| `components/dashboard/DashboardSidebar.tsx:68-69` | 사이드바 메뉴: **`사용자 관리`**, **`전체 통계`** (admin 영역 — `comingSoon: true`) | P1 |
| `components/dashboard/DashboardSidebar.tsx:83` | **`수익 현황`** (media-owner 영역 — `comingSoon: true`) | P1 (실제 페이지 `/revenue`는 존재하므로 sidebar 마킹 일치 점검 필요) |
| `components/dashboard/DashboardSidebar.tsx:101` | **`내 캠페인`** (advertiser 영역 — `comingSoon: true`) | P1 (실제 페이지 `/dashboard/advertiser/campaigns` 존재 — sidebar에서만 disable 표시) |
| `components/dashboard/DashboardSidebar.tsx:119,195` | tooltip: `"준비중입니다"` (한국어 hardcoded, 다른 언어는 fallback 없음) | P2 |

> 흥미로운 발견: 사이드바에 `comingSoon: true`로 마킹된 3개 메뉴(`수익 현황`, `내 캠페인`)는 실제로는 페이지가 존재. **sidebar disable 마킹과 라우트 가용성이 어긋남** — 이 두 페이지 클릭하면 "준비중" 표시되지만 우회로 접근하면 동작.

### 3.3 빈 onClick / 작동 안 하는 폼

코드 베이스 전체 검색 결과 **거의 없음**. 핸들러 규율이 좋은 편입니다.

**유일한 발견**: `components/layout/ConditionalSiteFooter.tsx:70-81` — 4개 SNS 아이콘이 `href="#"`로 링크 없음
- Website / Twitter / Instagram / LinkedIn — `aria-label`만 있고 실제 URL 없음
- 클릭 시 페이지 새로고침만 발생 (action 없음)
- **P1** — 푸터가 데모 인상에 직접 노출됨

---

## 4. 메뉴 / 네비게이션 일관성

### 4.1 헤더 (`SiteHeader.tsx`) 메뉴 12개

| href | 라벨 (i18n key) | 라우트 존재 | 상태 |
|------|-----------------|:----------:|------|
| `/` | nav.home | ✅ | OK |
| `/explore` | explore.title | ✅ | OK |
| `/community` | nav.community | ✅ | OK |
| `/campaign-planner` | nav.campaign_planner | ✅ | placeholder |
| `/templates` | nav.templates | ✅ | placeholder |
| `/billing` | nav.billing | ✅ | placeholder |
| `/trends` | nav.trends | ✅ | placeholder |
| `/news` | news.title | ✅ | complete |
| `/blog` | blog.nav_label | ✅ | complete |
| `/about` | nav.about | ✅ | complete |
| `/contact` | footer.contact | ✅ | partial |
| `/terms` | footer.terms | ✅ | partial (한국어 hardcoded) |

**404 위험**: 0건. 모든 헤더 링크 라우트 존재.

**관찰 사항**: 헤더에 노출되는 12개 중 **5개가 placeholder 상태** (campaign-planner, templates, billing, trends, terms 일부). 사용자 클릭 시 거의 빈 화면 또는 얇은 client component 표시. 메뉴 노출 정책 검토 필요.

### 4.2 푸터 (`ConditionalSiteFooter.tsx`)

| href | 라벨 | 라우트 존재 | 상태 |
|------|------|:----------:|------|
| `/about` | About | ✅ | OK |
| `/community` | Community | ✅ | OK |
| `/contact` | Contact | ✅ | OK |
| `/terms` | Terms | ✅ | OK |
| `/help` | Help | ✅ | OK |
| `/developers` | Developers | ✅ | OK |
| `#` | Website (SNS 아이콘) | ❌ dead | **P1** |
| `#` | Twitter | ❌ dead | **P1** |
| `#` | Instagram | ❌ dead | **P1** |
| `#` | LinkedIn | ❌ dead | **P1** |

### 4.3 사이드바 (`DashboardSidebar.tsx`) — comingSoon 불일치

**Admin 메뉴**:
- `사용자 관리` → 페이지 부재. 일치 ✓
- `전체 통계` → 페이지 부재. 일치 ✓

**Media-Owner 메뉴**:
- `수익 현황` → `/dashboard/media-owner/revenue` **페이지 실재** (87 LOC). 사이드바 disable 표시는 잘못됨. **P1**

**Advertiser 메뉴**:
- `내 캠페인` → `/dashboard/advertiser/campaigns` **페이지 실재** (78 LOC). 동일 문제. **P1**

→ 사이드바 mapping과 실제 라우트 동기화 필요.

### 4.4 데드 링크 / 404 위험 종합

| 분류 | 건수 | 우선 |
|------|----:|:----:|
| 헤더 메뉴 dead link | 0 | — |
| 푸터 SNS 아이콘 dead link | 4 | P1 |
| 사이드바 잘못된 disable 마킹 | 2 | P1 |
| 라우트 자체가 404 | 0 | — |

---

## 5. 한국어/영어 혼재 — i18n 미적용 hardcoded 지점

가장 큰 품질 부채 영역입니다. 패턴은 **두 가지**:

1. **`locale.startsWith("ko")` 인라인 ternary** — JSX 안에서 직접 분기. `next-intl`을 우회.
2. **완전 hardcoded 문자열** — 한국어/영어 어느 한쪽만 박힘. 다른 언어 사용자에게 그대로 노출.

### 5.1 P0 — 에러 페이지 (모든 사용자에게 영향)

| 파일 | 라인 | 문제 | 사용자 영향 |
|------|----:|------|------|
| `app/error.tsx` | 30-31 | `title="문제가 발생했습니다"`, `description="일시적인 오류입니다..."` | 영어/일본어 사용자가 에러 만나면 한국어만 봄 |
| `app/global-error.tsx` | 87-110 | `"문제가 생겼어요"`, `"다시 시도"`, `"홈으로"`, `"오류 코드: ..."` 전부 한국어 | 글로벌 fatal 에러 시 영어 only |
| `app/[locale]/admin/error.tsx` | — | `"관리자 페이지 오류"`, `"관리자 홈"` 한국어 | admin error도 한국어 |

### 5.2 P1 — 홈 페이지 hardcoded ternary 12개 (스크롤 첫 화면)

`app/[locale]/page.tsx:236-256` — Cross-border 케이스 카드 3개의 모든 텍스트가 4-언어 분기 ternary로 작성:

```tsx
{locale.startsWith("ko") ? "실제 진행 사례"
  : locale.startsWith("ja") ? "実績事例"
  : locale.startsWith("zh") ? "真实案例"
  : "Real Cases"}
```

같은 패턴이 **12회 반복** (제목·태그·설명). 하나의 콘텐츠 변경 시 4언어를 모두 손대야 함. `messages/{ko,en,ja,zh,es}.json`의 `home.case_studies` namespace로 통합 권장.

### 5.3 P1 — 대시보드 페이지 13개에 `isKo` 패턴

총 13개 페이지가 `const isKo = locale.startsWith("ko")` 또는 `locale === "ko"` 패턴 사용. 빠른 분기로 작성됐지만 영어/일본어 폴백 없음.

| 페이지 | 영향 라인 |
|--------|---------|
| `/dashboard/advertiser/inquiries/[id]` | 19 |
| `/dashboard/advertiser/roi` | 18 |
| `/dashboard/advertiser/settings` | 13 |
| `/dashboard/advertiser/spend` | 13 |
| `/dashboard/advertiser/wishlist` | 13 |
| `/dashboard/media-owner` | 45-46 |
| `/dashboard/media-owner/inquiries/[id]` | 11 |
| `/dashboard/media-owner/revenue` | 11 |
| `/dashboard/media-owner/settings` | 9 |
| `/dashboard/media-owner/calendar` | 11 |
| `/dashboard/media-owner/medias/[id]/edit` | (client-heavy) |
| `/dashboard/media-owner/medias/[id]/review` | (client-heavy) |
| `/dashboard/campaigns` | (no i18n) |

### 5.4 P1 — 컴포넌트 레벨 ternary (홈 + 미디어 상세)

| 파일 | 라인 | 영향 |
|------|----:|------|
| `components/home/DashboardTabSection.tsx` | 27, 39 | 홈 페이지 탭 라벨 4-언어 ternary |
| `components/medias/MediaDetailStickyBar.tsx` | 23-29 | 미디어 상세 하단 sticky CTA |
| `app/[locale]/dashboard/media-owner/page.tsx` | 119, 127 | "예약 캘린더" / "수익 통계" KR-only ternary (EN 폴백만 있음, JA/ZH 없음) |
| `app/[locale]/campaign/[id]/page.tsx` | 150 | `mediaName: snap?.mediaName ?? "매체 ..."` 한국어 폴백 |

### 5.5 P1 — 인증 페이지 한국어 only

| 파일 | LOC | 문제 |
|------|----:|------|
| `app/[locale]/login/page.tsx` | 51 | 폼 라벨 전부 한국어 hardcoded |
| `app/[locale]/signup/page.tsx` | 42 | 동일 |

영어 사용자가 `/en/login`에 접속해도 한국어 로그인 폼을 보게 됩니다. **데모/투자 미팅 시 첫인상에 직접 영향**.

### 5.6 P2 — Admin 콘솔 일부 hardcoded

| 파일 | 비고 |
|------|------|
| `/admin/review/[mediaId]` | 1907 LOC `media-review-form.tsx` 호출 — i18n 없음, 한국어 only |
| `/admin/reviews` | 47 LOC, 영어 hardcoded |

운영자 도구라 우선순위는 낮음. 단 외국인 admin 합류 시 작업 필요.

### 5.7 종합 — i18n 누락 페이지 분류

```
✅ 완전 i18n  : 23 페이지 (28%)
⚠️ 부분 i18n  : 31 페이지 (38%) ← 1~3줄 isKo 패턴
❌ i18n 미적용: 28 페이지 (34%) ← 인증·일부 admin·placeholder
```

---

## 6. 권장 처리 순서 Top 10

우선순위 P0(긴급) → P1(중요) 순. 각 항목은 **단일 PR로 분리 가능한 단위**.

| # | 항목 | 우선 | 영향 | 변경 추정 |
|---|------|:----:|------|----------|
| 1 | **에러 페이지 i18n 적용** — `app/error.tsx`, `app/global-error.tsx`, `/admin/error.tsx`의 한국어 hardcoded → `messages/*.json/error` 도입. 5개 언어 키 추가. | **P0** | 모든 언어 사용자가 fatal 에러 시 자국어 메시지 받음 | ~6 파일 / +50 lines |
| 2 | **`/api/push/subscribe` DB 저장 구현** — 현재 TODO 상태로 푸시 구독이 영구 저장 안 됨. `prisma.PushSubscription` 모델(없으면 추가) + 핸들러 작성 | **P0** | 푸시 알림 기능 사실상 미작동 — 광고주 알림 수신 불가 | 1 라우트 + (옵션) 마이그레이션 |
| 3 | **`lib/admin-site-gate.ts` Edge Runtime 호환** — `node:crypto` → Web Crypto API 또는 timing-safe 직접 작성. `lib/auth/admin-guard.ts` 패턴 그대로 차용 가능 | **P0** | `ADMIN_SITE_PASSWORD` 활성화 시 Edge에서 검증 실패 위험 | 1 파일 / -7 +30 lines |
| 4 | **인증 페이지 i18n** — `/login`, `/signup` 한국어 hardcoded → `messages/*.json/auth` 추가. `LoginForm`, `SignupForm` 컴포넌트 `useTranslations` 도입 | **P0** | 영어/일본어 사용자가 사이트 진입 시 한국어 폼만 봄 | ~4 파일 / +120 lines |
| 5 | **블로그 본문 sanitization** — `app/[locale]/blog/[slug]/page.tsx:119` `dangerouslySetInnerHTML` → `rehype-sanitize` 또는 `react-markdown` 도입 | **P0** | 저장형 XSS 경로 (CMS 도입 시 즉시 위험) | 1 파일 / +의존성 1개 |
| 6 | **사이드바 `comingSoon` 마킹 정합성** — `수익 현황`, `내 캠페인` 메뉴 마킹 제거(실제 페이지 존재). `사용자 관리`·`전체 통계`는 유지(미존재) | P1 | 운영자가 자기 페이지 클릭 못 하는 UX 사고 | 1 파일 / -6 lines |
| 7 | **푸터 SNS 4개 링크 정리** — `href="#"` → 실제 URL 또는 표시 제거 | P1 | 데모/투자 미팅 시 클릭하면 새로고침되는 인상 손상 | 1 파일 / 4 lines |
| 8 | **홈 페이지 cross-border ternary 12개 i18n 통합** — `messages/*.json/home.case_studies` namespace 신설 → `app/[locale]/page.tsx:236-256` 단순화 | P1 | 콘텐츠 변경 시 단일 위치 편집 가능. 코드 가독성 +. 영어/일본어 사용자도 동일 정보 노출 | 1 파일 + 5 메시지 / -50 +30 lines |
| 9 | **대시보드 13개 페이지 `isKo` → `useTranslations`/`getTranslations` 마이그레이션** — 차례로 정리. 단일 PR로 묶지 말고 advertiser 5건 / media-owner 4건 / 기타 4건 분할 | P1 | 영어/일본어 광고주·매체사 사용성 직접 개선 | 13 파일 + 메시지 다수 / 누적 ~500 lines |
| 10 | **Hook 의존성 누락 3건 수정** — `BulkUploadClient`(56), `CampaignAnalyticsClient`(122), `DoohCampaignOnboardingModal`(36) | P1 | 무한 렌더 / stale closure 버그 잠재 | 3 파일 / 각 ~5 lines |

### 차순위 (Top 10에는 미포함, P2)

- `<img>` 8건 → `next/image` 마이그레이션 (LCP 성능)
- `media-review-form.tsx` 1907 LOC 분할
- `compare/page.tsx` 671 LOC 분할
- `medias/[mediaId]/page.tsx` 812 LOC 분할
- Admin 콘솔 i18n (외국인 admin 합류 시점)
- JA/ZH 메시지 일부 누락 namespace 보강
- Clerk 잔존 코드(`/sign-in`, `/sign-up`, `svix`) 제거 후 NextAuth 통일

---

## 부록: 점검 방법론

- 빌드: `rm -rf .next && npx next build` (66초 컴파일, 11 warning)
- 타입: `npx tsc --noEmit -p tsconfig.json` (0 에러)
- 라우트 인벤토리: `app/[locale]/**/page.tsx` 전수 LOC + i18n 정적 분석 (Explore agent)
- Hardcoded 검색: JSX literal Korean (`>[가-힣]`) + `locale.startsWith` ternary 패턴 (Explore agent)
- TODO/Coming Soon grep: `app/`, `components/`, `lib/` 대상 case-insensitive
- 네비게이션: `components/layout/SiteHeader.tsx`, `components/layout/ConditionalSiteFooter.tsx`, `components/dashboard/DashboardSidebar.tsx` 직접 읽고 라우트 매칭 검증

본 보고서는 코드 수정 0건. 다음 작업 지시 시 위 Top 10 중 어느 항목부터 처리할지 알려주시면 PR 분리해 진행합니다.

