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

If you already have Postgres, set `DATABASE_URL` and run:

```bash
npx prisma db push
npx prisma db seed
```

### 4) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment (Vercel)

### 1) Create a Vercel project

- Import this repository into Vercel
- Set the **Environment Variables** (same keys as `.env.example`)

### 2) Database

Use a managed Postgres (e.g. Vercel Postgres / Neon / Supabase) and set `DATABASE_URL`.

### 3) Build

Vercel will run:

```bash
npm run build
```

## Notes

- `/admin` requires a DB user with role `ADMIN`
- `/dashboard/partner` requires a DB user with role `PARTNER`
- If you use AI review, set either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

