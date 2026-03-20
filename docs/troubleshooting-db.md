# DB / Prisma 오류

## `User.findUnique` — column does not exist

스키마에는 `User.onboardingCompleted` 등이 있는데 DB에 컬럼이 없을 때 발생합니다.

**해결 (하나만 실행):**

```bash
# 마이그레이션 적용 (배포·CI)
npx prisma migrate deploy

# 또는 로컬에서 스키마와 DB 강제 동기화
npx prisma db push
```

그다음:

```bash
npx prisma generate
```

개발 서버 재시작.

## 여전히 실패하면

Supabase/Neon SQL 에디터에서 확인:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'User';
```

`onboardingCompleted`, `role`, `clerkId`, `email` 이 있어야 합니다.
