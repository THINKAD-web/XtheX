# XtheX 배포 가이드 (Vercel)

본 문서는 **NextAuth v4 기준**입니다. 키 이름은 `NEXTAUTH_*` / `GOOGLE_CLIENT_*`. Auth.js v5 (`AUTH_*`)는 사용하지 않습니다 — 향후 마이그레이션 시 [§4 마이그레이션 매핑](#4-미래-마이그레이션-매핑) 참고.

---

## 1. Phase별 환경변수 매트릭스

`✅ 필수` = 미설정 시 해당 Phase 기능이 실패하거나 사이트가 부분 다운.
`◯ 선택` = 해당 기능을 켤 때만 필요.
`—` = 해당 Phase에서 사용 안 함.

| 키 | Phase 1 (현재) | Phase 2 — 지도/업로드 | Phase 4 — 결제 | Phase 5 — 이메일 | Phase 6 — AI | 비고 |
|----|:-:|:-:|:-:|:-:|:-:|------|
| `DATABASE_URL` | ✅ | ✅ | ✅ | ✅ | ✅ | Neon pooled URL |
| `NEXTAUTH_URL` | ✅ | ✅ | ✅ | ✅ | ✅ | 브라우저 접속 host:port와 정확히 일치 |
| `NEXTAUTH_SECRET` | ✅ | ✅ | ✅ | ✅ | ✅ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | ✅ | ✅ | ✅ | metadataBase·OG·Stripe 콜백용 |
| `NEXTAUTH_ADMIN_EMAILS` | ✅ | ✅ | ✅ | ✅ | ✅ | 신규 가입 시 ADMIN 자동 승격 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ◯ | ◯ | ◯ | ◯ | ◯ | Google 로그인 활성화 시 |
| `ADMIN_SITE_PASSWORD` | ◯ | ◯ | ◯ | ◯ | ◯ | `/admin/*` 2차 잠금 |
| `ADMIN_GATE_SECRET` | ◯ | ◯ | ◯ | ◯ | ◯ | 위 쿠키 HMAC (기본=NEXTAUTH_SECRET) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | — | ✅ | ✅ | ✅ | ✅ | referrer 제한 필수 |
| `GOOGLE_MAPS_GEOCODING_KEY` | — | ◯ | ◯ | ◯ | ◯ | 서버 전용, IP 제한 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | — | ✅ | ✅ | ✅ | ✅ | 매체 이미지 업로드 |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | — | ✅ | ✅ | ✅ | ✅ | unsigned preset 폴더/포맷 제한 필수 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | — | ◯ | ◯ | ◯ | ◯ | Cloudinary 대체 |
| `STRIPE_SECRET_KEY` | — | — | ✅ | ✅ | ✅ | inquiry checkout |
| `STRIPE_WEBHOOK_SECRET` | — | — | ✅ | ✅ | ✅ | `/api/webhooks/stripe` |
| `RESEND_API_KEY` | — | — | — | ✅ | ✅ | 메일 발송 |
| `RESEND_FROM` | — | — | — | ✅ | ✅ | 발신자 |
| `ADMIN_INQUIRY_NOTIFY_EMAIL` | — | — | — | ◯ | ◯ | 문의 알림 수신처 |
| `ANTHROPIC_API_KEY` | ◯ | ◯ | ◯ | ◯ | ✅ | 이미 `lib/ai/reviewProposal.ts`에서 사용 중 |
| `XAI_API_KEY` / `GROK_API_KEY` | ◯ | ◯ | ◯ | ◯ | ◯ | 자연어 매체 검색·매체 사진 분석 |
| `GROQ_API_KEY` | ◯ | ◯ | ◯ | ◯ | ◯ | 폴백 |
| `OPENAI_API_KEY` | ◯ | ◯ | ◯ | ◯ | ◯ | 최종 폴백·비전 |
| `SEOUL_DATA_API_KEY` | ◯ | ◯ | ◯ | ◯ | ◯ | 서울 유동인구 |

> **AI 키 정책**: 현재 4개 프로바이더가 공존하며 우선순위에 따라 자동 폴백합니다 (`lib/ai/openai-compatible-llm.ts`). **v1.1에서 Anthropic 단일화 검토 예정**입니다. 그때까지는 사용 중인 기능별로 필요한 키만 켜세요.

---

## 2. Vercel 환경 분리 원칙

| 환경 | 용도 | DB | 권장 설정 |
|------|------|-----|----------|
| **Production** | `main` 브랜치 자동 배포 | 운영 DB | 모든 Phase 1 키 + 활성 Phase 키 |
| **Preview** | PR 자동 배포 | **별도 DB(brand-new) 또는 read-only** | Production DB **사용 금지** |
| **Development** | `vercel dev` 로컬 | 로컬 DB | `.env.local`에서 관리 |

**환경 구분 체크리스트**
- [ ] `NEXTAUTH_URL`을 환경별로 다르게 설정 (Production = 운영 도메인, Preview = `https://<deployment-id>.vercel.app`은 Vercel이 자동 주입하는 `VERCEL_URL`을 사용해야 정확)
- [ ] `STRIPE_*` 키는 Production만 live, Preview/Dev는 test
- [ ] `NEXTAUTH_ADMIN_EMAILS`도 환경별 분리 (Preview에서 Production admin 이메일로 자동 승격되는 사고 방지)
- [ ] DB 마이그레이션은 Production에만 적용 — Preview는 신규 DB이거나 마이그레이션 없는 read-only

---

## 3. 배포 절차 (체크리스트)

1. **브랜치 푸시** → Vercel이 Preview 자동 빌드.
2. **Preview 빌드 로그**에서 다음 확인:
   - `[vercel-build] Running prisma migrate deploy` 또는 `... — skipping prisma migrate deploy` 메시지
   - `Compiled successfully` + `Middleware <size>`
3. **Preview URL**에서 스모크 테스트:
   - `/` → 홈 정상 (Hero·Features·FAQ 모두 렌더)
   - `/en/admin` → 비로그인이면 `/en/login?callbackUrl=/en/admin`으로 redirect
   - `/api/auth/session` → JSON 200 (빈 세션이어도 OK)
4. PR 머지 → Production 자동 빌드 → `https://<production-domain>/api/auth/session` 동일 확인.
5. **Production 환경변수 점검**:
   - `NEXTAUTH_SECRET` / `NEXTAUTH_URL` / `DATABASE_URL` / `NEXTAUTH_ADMIN_EMAILS` / `NEXT_PUBLIC_APP_URL` 모두 채워졌는가
   - 운영 admin 이메일로 한 번 로그인 후 `/admin` 진입 확인

**검증 커맨드 (배포 후)**

```bash
# 1) 메인 페이지
curl -sI https://<domain>/ | head -1
# 기대: HTTP/2 200

# 2) NextAuth 세션 엔드포인트 (JSON 보장)
curl -s https://<domain>/api/auth/session
# 기대: {} 또는 {"user":...}

# 3) 비로그인 admin 페이지 (redirect 확인)
curl -i -L --max-redirs 0 https://<domain>/en/admin
# 기대: 302/307 + Location: .../login?callbackUrl=...

# 4) 비로그인 admin API
curl -i -X POST https://<domain>/api/admin/media/x/approve
# 기대: HTTP/2 401  {"error":"Unauthorized"}
```

---

## 4. 미래 마이그레이션 매핑

### 4.1 NextAuth v4 → Auth.js v5 (`AUTH_*`)

업그레이드 시 키 이름이 자동으로 인식되지 않습니다. 코드 변경 + Vercel env 키 이름 변경 모두 필요. 매핑:

| 현재 (NextAuth v4) | Auth.js v5 |
|--------------------|------------|
| `NEXTAUTH_SECRET` | `AUTH_SECRET` |
| `NEXTAUTH_URL` | `AUTH_URL` |
| `GOOGLE_CLIENT_ID` | `AUTH_GOOGLE_ID` |
| `GOOGLE_CLIENT_SECRET` | `AUTH_GOOGLE_SECRET` |

추가로 변경해야 할 코드:
- `lib/auth/config.ts` — `authOptions` → `NextAuth({...})` export 형태
- 모든 `getServerSession(authOptions)` 호출 → `auth()`
- `lib/auth/admin-guard.ts`의 `getToken()` 호출 — Auth.js v5에서도 동일 동작이지만 import 경로 확인
- `app/api/auth/[...nextauth]/route.ts` — `NextAuth(authOptions)` 래퍼 변경

이 작업은 **별도 PR**로 분리할 것. 작은 PR로 쪼개 머지하지 말고, 단일 마이그레이션 PR로 진행 권장.

### 4.2 AI 프로바이더 단일화 (v1.1 예정)

대상: `lib/ai/openai-compatible-llm.ts`, `lib/ai/grok-proposal-structured.ts`, `lib/mix-media/parse-natural-language.ts`, `lib/ai/describe-user-media-photo.ts`.

이전 후 유지: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.
이전 후 제거: `XAI_API_KEY`, `GROK_API_KEY`, `XAI_MODEL`, `GROK_MODEL`, `XAI_VISION_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_VISION_MODEL`.

---

## 5. 자주 마주치는 배포 사고와 진단

| 증상 | 원인 후보 | 진단 |
|------|-----------|------|
| 모든 admin 페이지가 `/login`으로 튕김 | `NEXTAUTH_SECRET` 미설정 → JWT 검증 실패 | Vercel Production env 확인 |
| `/api/auth/session` 응답이 HTML | `NEXTAUTH_URL`이 실제 호스트와 불일치 | 도메인·포트·프로토콜 정확히 일치 확인 |
| `prisma migrate deploy` 실패로 빌드 중단 | DB 다운/드리프트 | `scripts/vercel-build.sh`가 best-effort 처리하지만 실패 메시지는 빌드 로그에 남음 |
| 홈 페이지 500 (recharts) | `outputFileTracingExcludes`가 차트 라이브러리 제외 | `next.config.mjs` 확인 (PR #1에서 수정 완료) |
| Stripe 결제가 success URL에서 막힘 | `NEXT_PUBLIC_APP_URL`이 deployed domain과 다름 | env 정합성 확인 |

---

## 6. 참고

- **커스텀 도메인**: Vercel 프로젝트 Settings → Domains 추가 후 DNS 설정 → `NEXT_PUBLIC_APP_URL`·`NEXTAUTH_URL` 동기화.
- **NextAuth admin 콘솔 보호**: 현재는 미들웨어(`middleware.ts`) + `lib/auth/admin-guard.ts` + 옵션 2차 잠금(`ADMIN_SITE_PASSWORD`)으로 구성. 신규 admin 페이지/API 추가 시 미들웨어가 자동으로 막아주지만, **API 핸들러 자체에도 `requireAdminApi()` 호출 유지** 권장 (defense in depth).
- **Neon DB**: IP 제한 사용 시 Vercel IP 또는 0.0.0.0/0 임시 허용 후 보안 그룹으로 단계적 조임.
