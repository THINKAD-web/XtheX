# 온보딩 & UserRole 마이그레이션

## Prisma

`Role`(PARTNER/BRAND/ADMIN) → `UserRole`(ADVERTISER/MEDIA_OWNER/ADMIN), `User.onboardingCompleted` 추가.

```bash
npx prisma migrate deploy
# 또는 개발 DB 초기화 시
npx prisma db push
```

기존 DB가 있으면 마이그레이션 SQL(`prisma/migrations/20260317120000_user_role_onboarding/migration.sql`)이  
PARTNER→MEDIA_OWNER, BRAND→ADVERTISER, ADMIN→ADMIN 으로 옮기고, **기존 행은 `onboardingCompleted: true`** 로 두어 강제 온보딩을 피합니다.

## 플로우

1. 신규 가입(Clerk webhook) → `ADVERTISER`, `onboardingCompleted: false`
2. 로그인 후 `OnboardingGate` → 미완료 시 `/onboarding/role`
3. 역할 선택 → `/onboarding/wizard?flow=advertiser|media`
4. 완료 시 `POST /api/onboarding/complete` + `sessionStorage xthex_onboarding_ok`

## 라우트

- `/onboarding/role` — 역할 선택
- `/onboarding/wizard` — 위저드
- `/upload` — `/admin/ai-upload` 리다이렉트
