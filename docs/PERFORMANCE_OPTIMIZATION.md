# XtheX 성능 최적화 요약

## 적용된 변경 사항

### 1. 지도 (MixMediaMap) 최적화
- **동적 로딩**: `MixMediaMapLazy` 래퍼 추가 — `dynamic(import('./MixMediaMap'), { ssr: false })`로 지도 청크 분리, 초기 로딩 시 스켈레톤 표시
- **마커 제한**: Leaflet/Google Maps 모두 **초기 50개** 마커만 렌더 (나머지는 slice). zoom 변경 시 추가 로드는 추후 확장 가능
- **Google Maps**: 기존 `APIProvider`에 `language="ko"` `region="KR"` 유지
- **사용처**: `MediaMixSearchSection`, `CampaignDetailClient`에서 `MixMediaMap` → `MixMediaMapLazy`로 교체

### 2. 매체 카드 그리드
- **이미지**: `ImageCarousel`에서 `next/image` 사용 — `loading="lazy"`, `sizes="(max-width: 768px) 100vw, 33vw"`, data/blob URL은 기존 `<img>` 유지
- **호버**: `landing.card` / `cardDark`에서 `hover:scale-[1.02]` 제거 → `hover:brightness-[1.02]` + `hover:shadow-2xl` (GPU 부하 감소)
- **탐색 페이지**: 이미 `useInView` 기반 “더 불러오기” 사용 중 (무한 스크롤 유사)

### 3. 전체 페이지
- **폰트**: `app/layout.tsx`에서 `next/font`에 `display: "swap"` 추가
- **로딩 UI**: `app/[locale]/loading.tsx` 추가 — locale 라우트 전환 시 스켈레톤 표시
- **번들 분석**: `@next/bundle-analyzer` 적용, `ANALYZE=true next build`로 분석 가능

### 4. 스크립트 및 테스트
- **package.json**: `"analyze": "ANALYZE=true next build"` 추가
- **프로덕션 테스트**: `npm run build` 후 `npm run start`로 프로덕션 모드에서 LCP/TTI 확인

## 필요 패키지
- `@next/bundle-analyzer` — 이미 설치됨

## Lighthouse 점수 향상 예상
- **LCP**: 지도/무거운 컴포넌트 지연 로딩 + 이미지 lazy → **2.5초 이내** 목표 달성 가능
- **TTI**: 초기 JS 청크 감소(지도 분리) + 카드 호버 경량화 → **개선 예상**
- **모바일**: 스켈레톤, lazy 이미지, 50개 마커 제한 → **스크롤/탐색 부드러움 개선 예상**

## 참고
- `app/[locale]/admin/review/[mediaId]/error.tsx`의 Button `asChild` 타입 오류는 기존 이슈이며, 성능 변경과 무관합니다. 수정 후 `npm run build` 재실행하면 됩니다.
