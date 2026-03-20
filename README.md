## XtheX

Global outdoor advertising marketplace:

- **Partners** upload media proposals → **AI review** → admin approval
- **Brands** explore approved media on a map and contact partners

## Tech

- Next.js (App Router) + TypeScript + Tailwind
- Clerk (Auth)
- Prisma + PostgreSQL

## Setup (Local)

### 1) Install

```bash
npm install
```

### 2) Environment variables

Copy `.env.example` to `.env.local` and fill values.

```bash
cp .env.example .env.local
```

Minimum to run the app:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (for `/explore` map)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (for partner image upload)

Optional (서울 생활인구 일 유동인구 제안):

- `SEOUL_DATA_API_KEY` — [서울 열린데이터광장](https://data.seoul.go.kr) 인증키. 성수 등 주소 입력 시 행정동 단위 생활인구 API로 일 유동인구 제안 (미설정 시 fallback 추정치 사용).

### Clerk Webhook (User sync)

This project can auto-sync Clerk users into Prisma `User` via webhook:

- **Clerk Dashboard** → **Webhooks** → **Add Endpoint**
  - Endpoint URL: `https://your-domain/api/webhooks/clerk`
  - Events: `user.created`, `user.updated` (optional: `user.deleted`)
- Copy the **Signing secret** and set it as:
  - `CLERK_WEBHOOK_SECRET` in `.env.local` / Vercel env vars

Local testing:

- Use a tunneling tool like **ngrok** to expose your dev server, then set the webhook endpoint to:
  - `https://<your-ngrok-subdomain>.ngrok.app/api/webhooks/clerk`

### 3) Database

**방법 A — Docker (로컬 Postgres):**  
`.env.local`에 이미 `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/xthex` 가 들어 있다면:

```bash
docker compose up -d
npx prisma db push
npx prisma db seed
```

(Docker Desktop 등 Docker 설치 필요.)

**방법 B — Neon (클라우드, 가입만 하면 됨):**

1. [neon.tech](https://neon.tech) 가입 후 **New Project** 생성
2. 대시보드에서 **Connection string** 복사
3. `.env.local`에서 `DATABASE_URL=` 뒤를 그 connection string으로 교체
4. `npx prisma db push` → `npx prisma db seed`

**로컬 Postgres를 이미 쓰는 경우:** `.env.local`에 `DATABASE_URL`만 맞게 넣은 뒤 `npx prisma db push` / `npx prisma db seed` 실행.

### 4) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

**`spawn EBADF` (macOS / Turbopack):** 기본 `npm run dev`는 Webpack 모드입니다. Turbopack을 쓰려면 `npm run dev:turbo` — EBADF가 나면 Webpack(`npm run dev`)을 유지하세요.

## Deployment (Vercel)

### Root Directory (중요)

이 저장소는 **루트에 `package.json` 하나**만 있습니다 (`app/`, `src/` 아래에 별도 패키지 없음).

- Vercel 프로젝트 **Settings → General → Root Directory** 는 **비워 두세요** (또는 `.` 만).
- `apps/web` 같은 하위 폴더로 잘못 지정하면, 그 폴더에 `package.json`이 없어 **“No Next.js version detected”** 가 납니다.

### `package.json`에 `next` 필수

배포에 쓰이는 브랜치의 `package.json` **`dependencies`**(또는 `devDependencies`)에 **`next`** 가 있어야 합니다.  
이 프로젝트는 예: `"next": "^15.0.0"` 대역(실제로는 15.x 최신으로 설치), `"react"` / `"react-dom": "^18.3.1"` 을 사용합니다.

**GitHub에 반드시 푸시할 것:** `package.json` + `package-lock.json` (lockfile 없이 배포하면 버전이 어긋날 수 있음).

### 1) Create a Vercel project

- Import this repository into Vercel
- Set **Environment Variables** (Production + Preview 권장):
  - `DATABASE_URL` — Neon 등 Postgres connection string
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - 기타 `.env.example` / 로컬 `.env.local`과 동일한 키

`postinstall`에서 `prisma generate`가 실행되므로 별도 Build Command 변경은 보통 불필요합니다.

### 2) Database

Neon/Supabase 등에서 DB를 만든 뒤 Vercel에 `DATABASE_URL`을 넣고, **한 번** 로컬 또는 CI에서:

```bash
npx prisma db push
npx prisma db seed   # 선택
```

### 3) Build

Vercel will run:

```bash
npm run build
```

### “No Next.js version detected” 가 날 때

1. GitHub에서 해당 브랜치의 **루트 `package.json`** 을 열어 `dependencies` 안에 `"next"` 가 있는지 확인.
2. Vercel **Root Directory** 가 위에서 말한 대로 비어 있는지 확인.
3. 로컬에서 의존성 재설치 후 빌드 확인:

```bash
rm -rf node_modules
npm install
npm run build
```

4. 수정 후 커밋·푸시 → Vercel이 같은 브랜치를 다시 빌드하는지 확인.

## Notes

- `/admin` requires a DB user with role `ADMIN`
- `/dashboard/partner` requires a DB user with role `PARTNER`
- AI 추출/검토: **`XAI_API_KEY`** (Grok) 권장. 또는 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`

