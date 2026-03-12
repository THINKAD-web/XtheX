# XtheX 전체 사이트 배포 가이드 (Vercel)

## 1. Vercel 배포 필수 환경 변수

Vercel 프로젝트에 아래 환경 변수를 설정해야 합니다. **Production**, **Preview**, **Development** 중 필요한 환경에 체크 후 입력하세요.

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 인증 퍼블릭 키 | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Clerk 시크릿 키 | 동일 경로, 노출 금지 |
| `CLERK_WEBHOOK_SECRET` | Clerk 웹훅 서명 검증용 | 웹훅 설정 시 발급 |
| `DATABASE_URL` | Neon DB 연결 문자열 (pooled) | Neon 대시보드 Connection string (pooled) |
| `DIRECT_URL` | Neon DB 직접 연결 (마이그레이션용) | Neon Connection string (direct) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API 키 | /explore 지도 표시용 |
| `NEXT_PUBLIC_APP_URL` | 배포된 사이트 URL | 예: `https://xthex.vercel.app` 또는 커스텀 도메인 |

- `NEXT_PUBLIC_*` 는 브라우저에 노출되므로 공개해도 되는 값만 넣습니다.
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `DATABASE_URL`, `DIRECT_URL` 는 비공개로 유지하세요.

---

## 2. Vercel 대시보드에서 환경 변수 추가 방법

1. [Vercel](https://vercel.com) 로그인 후 해당 프로젝트 선택.
2. 상단 **Settings** 탭 클릭.
3. 왼쪽 메뉴에서 **Environment Variables** 선택.
4. **Key**에 변수명, **Value**에 값을 입력.
5. **Environment**에서 적용할 환경 선택 (Production / Preview / Development).
6. **Save** 저장.

추가 후 재배포가 필요할 수 있습니다. **Deployments** 탭에서 최신 배포의 **Redeploy**를 실행하세요.

---

## 3. Git 푸시 후 배포 트리거

Vercel이 해당 저장소와 연결되어 있으면 `main`(또는 설정한 브랜치)에 푸시할 때마다 자동 배포됩니다.

```bash
git add .
git commit -m "Complete About page"
git push origin main
```

- 푸시 후 Vercel 대시보드 **Deployments**에서 빌드·배포 상태 확인.
- 빌드 실패 시 로그에서 환경 변수 누락, 빌드 에러 등을 확인.

---

## 4. 배포 후 확인 포인트

| 확인 항목 | 방법 |
|-----------|------|
| **회사 소개 페이지** | `https://xthex.vercel.app/about` (또는 실제 도메인) 접속 후 Hero, 비전/미션, 문제 해결, Stats, Testimonials, FAQ, CTA 순서로 표시되는지 확인. |
| **메타 태그** | 브라우저 개발자 도구 → Elements → `<head>` 내 `title`, `meta name="description"`, `og:title`, `og:description`, `og:image`, `og:url` 등 확인. |
| **OG 이미지** | `public/og-image.png` (1200×630) 존재 시 SNS 공유 미리보기에 이미지 노출되는지 확인. |
| **Favicon** | `public/favicon.ico` 존재 시 탭 아이콘 표시 확인. |
| **지도 로드** | `/explore` 접속 후 Google Maps가 정상 로드되는지 확인. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 및 도메인 제한 설정 확인. |
| **Clerk 로그인** | Sign in / Sign up 동작 및 리다이렉트 확인. `NEXT_PUBLIC_APP_URL`이 배포 URL과 일치하는지 확인. |

---

## 5. 참고

- **커스텀 도메인**: Vercel 프로젝트 **Settings** → **Domains**에서 추가 후 DNS 설정.
- **Clerk**: Production 도메인을 Clerk Dashboard의 **Allowed redirect URLs** 등에 추가.
- **Neon**: IP 제한이 있다면 Vercel IP 또는 0.0.0.0/0 허용 후 보안 그룹으로 제한 검토.
