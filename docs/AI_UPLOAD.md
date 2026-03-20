# AI 미디어 업로드가 안 될 때

## 1. dev 서버 재시작

`proxy.ts`·`next.config.mjs`를 바꾼 뒤에는 **`npm run dev`를 한 번 끄고 다시 켜세요.**

## 2. 로그인 · DB 사용자

- **Clerk로 로그인**되어 있어야 합니다.
- DB `User` 테이블에 **현재 계정의 `clerkId`**가 있어야 합니다. 없으면 다른 관리 페이지 진입 시 동기화되거나, 수동으로 행을 넣어야 할 수 있습니다.
- 토스트에 **「사용자 정보를 찾을 수 없습니다」**가 뜨면 이 경우입니다.

## 3. 파일 형식

- **PDF**를 권장합니다. (PPT/PPTX는 코드에서 막거나 제한될 수 있음)
- 확장자 `.pdf` / MIME이 맞는지 확인하세요.

## 4. 파일 크기

- 앱 쪽 제한은 **최대 약 50MB**(코드) + Next **`proxyClientMaxBodySize` 55MB**입니다.
- 더 크면 업로드가 잘리거나 **Unexpected end of form** 같은 오류가 납니다.

## 5. 실제 AI 추출 (Grok / 목업이 아닌 경우)

- `.env.local`에 **`XAI_API_KEY`** ( [console.x.ai](https://console.x.ai/) ) 를 넣으세요. **Grok**이 PDF 텍스트를 구조화합니다.
- xAI에서 **403 / credits or licenses** 가 나오면: 새 팀은 **크레딧·라이선스 구매** 전에는 API가 막힙니다. 콘솔 Billing에서 충전하거나, **무료 티어**로 **`GROQ_API_KEY`**(gsk_…)만 쓰고 xAI 키는 비우세요.
- 선택: `XAI_MODEL=grok-3-mini` (기본) 또는 콘솔 **Models**에 나온 이름 (`grok-3`, `grok-4-fast-non-reasoning` 등). `grok-2-latest`는 더 이상 없음.
- 하위호환: `OPENAI_API_KEY`만 있으면 OpenAI로 동일 추출

## Vision(페이지 이미지 분석) — xAI만

1. **1차**: 제안서 **텍스트만**으로 Grok 구조화 추출(가격·CPM·표 정확도 유지).
2. **2차**: PDF 페이지를 **PNG(또는 JPEG)** 로 렌더(최대 8장, 사진·LED·디지털·표 의심 페이지 우선) → **Vision 전용 모델**로 `page_summaries` JSON → 각 초안 **설명·추가메모**에 `페이지 N 이미지: …` 병합.
3. Vision 실패 시: 각 항목에 `이미지 분석 실패: PDF 원본 확인하세요` 안내.

**패키지:** `pdfjs-dist`, `canvas`, `sharp` (`npm install sharp`)

**.env.local 예시**
```env
XAI_MODEL=grok-3                          # 텍스트 추출용
XAI_VISION_MODEL=grok-4                   # 2차 이미지 분석 (기본; 콘솔 Models에서 변경 가능)
PDF_VISION_MAX_PAGES=8                    # 1~10
PDF_VISION_JPEG=1                         # 선택: JPEG q70으로 용량 절감 (기본 PNG)
PDF_VISION_DISABLE=1                      # Vision 끄기
```

**테스트:** 관리자 AI 업로드로 사진 많은 PDF 업로드 → 터미널에 `[pdf-page-images] Vision … N장`, `[grok-structured] Vision 요약 M건` → 검토 화면 설명에 `[페이지 이미지 분석]` 블록 확인.

### 주소 재파싱 테스트

1. DB: `npx prisma db push` 또는 마이그레이션 적용 (`Media.parseHistory`).
2. AI 업로드로 PDF 1건 추출 → 검토 화면(또는 AI 업로드 목록에서 「추출 데이터 확인·수정」).
3. 상단 **설치 위치** 카드에서 주소가 비어 있으면 빨간 **주소 누락** 배지 확인.
4. 구/군·시·도 또는 상세 주소를 수동 입력 → **주소 수정 후 재파싱** 클릭.
5. 로딩 문구 후 토스트 **「재파싱 완료! 확인해 주세요」** → 폼이 Grok 재추출 결과로 갱신되는지 확인.
6. 터미널 로그에 `[grok-structured] [재파싱] 추출 완료` 가 찍히는지 확인.
7. **임시 저장** 후 DB `Media.parseHistory`에 `backups` 배열이 쌓였는지 확인(선택).

**S3/Supabase URL 저장:** 현재는 설명 문자열만 DB에 반영. 썸네일 URL이 필요하면 렌더 PNG를 스토리지에 올리는 별도 작업을 추가하면 됩니다.

## 위도·경도 / 이미지 URL

- **http(s) URL**은 본문에 있을 때만 `images[]`에 들어갑니다. 임베드 사진은 위 Vision 설명 문자열로만 반영됩니다. 실제 파일 업로드는 검토 단계에서 Cloudinary 등으로 하면 됩니다.
- **위도·경도**도 제안서에 숫자로 적혀 있지 않으면 AI는 `null`을 냅니다(지도 좌표를 지어내지 않도록 함). **주소가 있으면** 업로드/재파싱 후 서버가 **Google Geocoding**으로 좌표를 채웁니다.
  - `.env.local`에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 또는 전용 `GOOGLE_MAPS_GEOCODING_KEY` + Google Cloud에서 **Geocoding API** 사용 설정.

## 6. 인증(Clerk) 오류

- 토스트에 **「proxy.ts」「clerkMiddleware」「인증」** 관련 문구가 나오면, 프로젝트 루트에 **`proxy.ts`**가 있고 `clerkMiddleware`가 적용돼 있는지 확인한 뒤 서버를 재시작하세요.

## 재파싱

- **재파싱**은 `POST /api/admin/reparse-proposal`(Node)에서 처리합니다. 로컬 PDF는 `.data/proposals/{mediaId}.pdf` 에서 읽습니다.
- 저장 경로를 바꾸려면 `.env.local`에 `XTHEX_PROPOSAL_DIR=/절대/경로` 를 설정하세요.
- 검토 페이지 **재파싱**은 저장된 원본 PDF가 있어야 합니다.
- **이번 수정 이후** AI 업로드한 건은 서버 `.data/proposals/`에 파일이 남고 재파싱 가능합니다.
- 그 이전에 만든 초안(`proposalFileUrl` 없음)은 **같은 PDF를 AI 업로드로 다시 올려** 새 초안을 만드세요.

## 프로덕션(Vercel 등)

- 로컬 디스크 저장은 배포 시 유지되지 않습니다. 상용에서는 S3 등에 PDF를 올리고 `proposalFileUrl`에 공개/서명 URL을 넣는 방식으로 확장하세요.

## API

- `POST /api/admin/upload-proposal` — `FormData`: 필드 **`files`** (여러 개 가능, 파일마다 초안 1건), 선택 **`adminMemo`** (공통 메모).
