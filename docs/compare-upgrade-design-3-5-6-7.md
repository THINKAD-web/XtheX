# DOOH 비교 페이지 업그레이드 설계 (3·5·6·7번)

목표: DB 변경 최소, 무료 API + 프론트/서버 로직으로 “AI 느낌” 강화.  
대상: `/[locale]/compare` 및 `/[locale]/medias/[mediaId]`.

---

## 3. 실시간/동적 요소 (날씨·시간 기반 추천)

### 목표
- OpenWeather 무료 API(Seoul)로 현재 날씨/시간 반영.
- “비 오는 날 CPM 효과 +20% 예상”, “출퇴근 시간 강남 LED 효과 UP” 같은 **동적 트리거** 문구로 차별화.

### 데이터/API
- **OpenWeather**: `https://api.openweathermap.org/data/2.5/weather?q=Seoul,KR&appid={API_KEY}&units=metric`
  - 무료 티어: 1,000 call/일. 캐시 10~30분 권장.
- **시간대**: 클라이언트 `new Date()` 또는 서버 `new Date()`로 `getHours()` (0~23).  
  - 7~9 → 출근, 17~20 → 퇴근, 그 외 → 일반.

### 컴포넌트 구조
```
components/compare/
  WeatherContext.tsx   (선택) React context로 날씨/시간 공유
  WeatherHint.tsx      Alert/Badge: 날씨+시간 기반 1~2문장 추천 문구
```
- **WeatherHint**  
  - `locale`, `medias` (또는 `bestPrice`/`bestTrust` 한두 개) 받음.  
  - 날씨: 비 → “비 오는 날 실내·대중교통 노출 집중…”, 맑음+출퇴근 → “강남/역세권 LED 효과 UP” 등 **룰 테이블** 기반 문구.  
  - 시간: 출퇴근 구간이면 “현재 출퇴근 시간대, 역·사무가 밀집 매체 추천” 등.

### 룰 테이블 (예시, JSON/하드코딩)
```ts
// lib/compare/weather-hint-rules.ts
type WeatherCondition = "rain" | "clear" | "clouds" | "snow" | "default";
type TimeSlot = "morning_rush" | "evening_rush" | "day" | "night";

const HINTS: Record<WeatherCondition, Partial<Record<TimeSlot, string>>> = {
  rain: {
    morning_rush: "비 오는 날 출근 시간대, 역·대중교통 매체 집중도↑ CPM 효과 기대.",
    default: "비 오는 날 실내·대중교통 노출 가치 상승. 지하철·실내 디스플레이 추천.",
  },
  clear: {
    evening_rush: "맑은 날 퇴근 시간, 야외 LED·빌보드 시인성 좋음. 강남·홍대권 추천.",
  },
  // ...
};
```
- OpenWeather `weather[0].main` (Rain, Clear, Clouds, Snow…) → 우리 `WeatherCondition` 매핑.
- `getHours()` → `TimeSlot` 매핑 후 `HINTS[weather][timeSlot] ?? HINTS[weather].default ?? HINTS.default` 반환.

### API 라우트 (캐시)
- `GET /api/weather?city=Seoul` (또는 서버 액션)
  - 서버에서 OpenWeather 호출, `revalidate: 3600` 또는 `cache-control` 30분.
  - 클라이언트는 Compare 페이지 마운트 시 1회 fetch.

### 배치
- Compare 페이지 상단(헤더 아래) 또는 “간단 비교 통계” 위에 `<WeatherHint />` 한 줄.
- 스타일: `Alert` 또는 `Badge` (예: `border-amber-500/50 bg-amber-500/10`).

### 환경 변수
- `NEXT_PUBLIC_OPENWEATHER_API_KEY` 또는 `OPENWEATHER_API_KEY` (서버만 쓰면 후자).

---

## 5. 매체 상세 페이지 링크 & 갤러리 확장

### 목표
- 비교 테이블 각 매체 행에 “상세 보기” 링크 유지/강조.
- 상세 페이지 `/[locale]/medias/[mediaId]` 에서 **대표 이미지 슬라이드(3~5장)** + **“실제 집행 사례”** 섹션 추가.

### 현재 상태
- Compare 테이블: 매체명이 이미 `Link` to `/[locale]/medias/[m.id]`.
- 상세 페이지: `media.images` 배열로 이미지 표시 가능.

### 상세 페이지 변경
- **갤러리**
  - `media.images` 3~5장(또는 전부)을 **슬라이드 쇼**로 표시.  
    기존 `ImageCarousel` 재사용 또는 Embla Carousel 유지.
  - 상단 히어로 1장 + 아래 “갤러리” 섹션에서 썸네일/닷 네비게이션으로 나머지 선택.
- **“실제 집행 사례” 섹션**
  - DB 필드 없이 **고정 구조**로 진행 권장.
  - 예: `media.caseStudyJson` (Json?) 추가 시 `{ titleKo, titleEn, descriptionKo, descriptionEn, imageUrls?: string[] }[]`.  
    또는 당장은 **하드코딩/플레이스홀더**:  
    - “집행 사례 (샘플)” 제목 + 1~2개 placeholder 이미지 + 짧은 설명 텍스트.
  - 컴포넌트: `components/medias/MediaCaseStudies.tsx` (props: `caseStudies[]`, `locale`).  
    상세 페이지에서 `caseStudies={[]}` 또는 `caseStudies={media.caseStudyJson ?? []}` 전달.

### Compare 쪽
- “상세 보기”를 테이블 셀 또는 행 하단에 **버튼/링크**로 한 번 더 노출 (예: 대표 이미지 오른쪽, 또는 “타겟팅” 행 아래).
- 변경 최소: 기존 매체명 링크만으로도 가능; 필요 시 “상세” 아이콘+텍스트 버튼 추가.

### 정리
- **갤러리 확장**: 상세 페이지에서 `ImageCarousel`/슬라이드로 `images` 3~5장 확실히 노출.
- **집행 사례**: 1단계는 placeholder 섹션 + (선택) `Media.caseStudyJson` 스키마 추가 후 연동.

---

## 6. 추천 로직 & AI 제안 박스 강화

### 목표
- “가성비 추천” “신뢰도 추천” 아래에 **상세 이유** 룰베이스 텍스트.
- “이 예산 범위 추천 조합”처럼 **멀티 매체 추천** 문구(if-then 룰).

### 데이터
- DB 추가 없음. Compare 페이지가 이미 가진 `medias`, `bestPrice`, `bestTrust`, `minPrice`, `maxPrice`, `minCpm` 등으로 계산.

### 룰 설계
- **가성비 추천 이유**
  - `bestPrice`가 있으면:  
    “{mediaName}은 비교 매체 중 최저가에 가깝습니다. 예산 효율을 중시할 때 추천.”
  - + `bestPrice`가 여의도/강남 등이면: “금융·프리미엄 상권으로 고소득층 도달에 유리.”
- **신뢰도 추천 이유**
  - `bestTrust`가 있으면:  
    “{mediaName}은 신뢰도 점수가 가장 높습니다. 브랜드 안전성·품질을 중시할 때 추천.”
- **예산 구간별 추천 조합**
  - 입력: `budget` (예: 성과 시뮬에서 쓰는 값 또는 고정 3구간: 3천만/5천만/1억).
  - 룰:  
    - budget < 3천만 → “비교 중 저예산 매체 1개 집중 추천” + `minPrice` 매체명.  
    - 3천만 ≤ budget < 1억 → “2~3개 매체 조합으로 도달·빈도 분산 추천” + bestPrice + bestTrust 이름.  
    - budget ≥ 1억 → “전체 매체 포트폴리오로 노출 극대화 추천.”
  - 문구는 `lib/compare/recommendation-reasons.ts` 같은 모듈에 `getReasonText({ bestPrice, bestTrust, budget, locale })` 형태로 반환.

### 컴포넌트
- **RecommendationReasons** (또는 기존 “간단 비교 통계” 카드 확장)
  - props: `bestPrice`, `bestTrust`, `budget` (선택, 시뮬과 연동 시 전달), `locale`.
  - “가성비 추천” 카드 아래 `<p className="text-xs text-zinc-400">…</p>` 로 이유 1~2문장.
  - “신뢰도 추천” 카드 아래 동일.
  - (선택) “이 예산이면?” 블록: 예산 입력 또는 시뮬 예산 연동 → `getReasonText` 호출 → “이 예산 범위 추천 조합” 문구 + 매체명 나열.

### 배치
- Compare 페이지 “간단 비교 통계” 섹션 내부, 기존 카드들 바로 아래.

---

## 7. 모바일/반응형 최적화 & 공유 버튼

### 목표
- 테이블: 가로 스크롤 유지, 터치 친화적.
- 상단 “이 비교 공유하기”: URL 복사 + (선택) PDF 내보내기.

### 테이블 반응형
- 이미 `overflow-x-auto` 사용 중이면 유지.
- 추가:
  - `min-w-[...]` 또는 `table-layout: auto`로 셀 너비 적절히.
  - 터치 스크롤: `-webkit-overflow-scrolling: touch` (필요 시).
  - 첫 열(항목) 고정: `position: sticky; left: 0; background: ...` (선택).

### 공유 버튼
- **위치**: Compare 페이지 헤더 영역, “매체 탐색으로 돌아가기” 옆 또는 왼쪽.
- **동작**
  1. **URL 복사**
     - `navigator.clipboard.writeText(window.location.href)`.
     - 토스트: “링크가 복사되었습니다.”
  2. **PDF 내보내기 (선택)**
     - 라이브러리: `jspdf` + `html2canvas` 또는 `@react-pdf/renderer`.  
       번들 크기 고려 시 “PDF로 저장”은 별도 라우트 `GET /api/compare-pdf?ids=...` 에서 서버에서 PDF 생성 후 다운로드 링크 제공도 가능.
     - 1단계: **URL 복사만** 구현. 2단계에서 PDF 추가 권장.

### 컴포넌트
- **ShareCompareButton** (client)
  - props: `ids: string[]`, `locale: string`.
  - 버튼 클릭 → 현재 페이지 URL (또는 `/${locale}/compare?ids=${ids.join(',')}`) 복사 → 토스트.
  - 아이콘: `Share2` (lucide-react).

### 반응형 체크리스트
- [ ] Compare: 테이블 가로 스크롤, 320px~768px에서 레이아웃 깨지지 않음.
- [ ] 성과 시뮬: 슬라이더/입력이 모바일에서 터치하기 좋은 크기.
- [ ] 차트: `ResponsiveContainer` 유지, 작은 화면에서 레이아웃/텍스트 잘리지 않게.

---

## 구현 순서 제안

| 순서 | 항목 | 예상 공수 | 의존성 |
|------|------|-----------|--------|
| 1 | 7. 공유 버튼 (URL 복사) | 0.5일 | 없음 |
| 2 | 6. 추천 이유 텍스트 (가성비/신뢰도) | 0.5일 | 없음 |
| 3 | 3. WeatherHint + OpenWeather 연동 | 1일 | API 키, 캐시 라우트 |
| 4 | 5. 상세 페이지 갤러리 확장 + 집행 사례 placeholder | 1일 | 없음 |
| 5 | 6. 예산별 추천 조합 문구 | 0.5일 | 시뮬 예산 연동 시 |
| 6 | 7. PDF 내보내기 (선택) | 1일 | 라이브러리 또는 API |

---

## 파일/모듈 매핑 요약

| 기능 | 파일/경로 |
|------|-----------|
| 3. 날씨 룰 | `lib/compare/weather-hint-rules.ts` |
| 3. 날씨 API | `app/api/weather/route.ts` (또는 server action) |
| 3. UI | `components/compare/WeatherHint.tsx` |
| 5. 갤러리/사례 | `components/medias/MediaCaseStudies.tsx`, 상세 페이지 레이아웃 수정 |
| 6. 추천 이유 | `lib/compare/recommendation-reasons.ts` |
| 6. UI | Compare “간단 비교 통계” 카드 확장 또는 `RecommendationReasons.tsx` |
| 7. 공유 | `components/compare/ShareCompareButton.tsx` |
| 7. PDF (선택) | `app/api/compare-pdf/route.ts` 또는 클라이언트 `html2pdf` |

이 순서대로 적용하면, DB 변경 없이 DOOH 트렌드(동적 컨텍스트, 성과·추천 강화, 공유)를 반영할 수 있습니다.
