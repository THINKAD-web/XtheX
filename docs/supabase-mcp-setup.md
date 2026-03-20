# Supabase MCP (Cursor) 설정 가이드

## 목표

- Cursor에서 **Supabase 공식 MCP** (`https://mcp.supabase.com/mcp`)로 프로젝트/DB 도구를 쓴다.
- 인증(OAuth 또는 PAT) 후 **Tools & MCP**에서 연결 상태를 확인한다.
- (선택) MCP로 `Campaign` 테이블 스키마를 조회한다.
- 앱 데이터는 **Prisma → Postgres** (`DATABASE_URL`)가 단일 소스이며, Supabase는 **호스팅 DB + Storage**로 쓰는 구성이 일반적이다.

---

## 1. 프로젝트에 이미 들어 있는 설정

루트에 **`.cursor/mcp.json`** 이 있으며 내용은 다음과 같다.

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

**다음 단계:** Cursor를 **완전히 재시작**한 뒤 Settings를 연다.

---

## 2. 인증 (기본: OAuth / 동적 클라이언트 등록)

Supabase 호스팅 MCP는 기본적으로 **브라우저 로그인(OAuth)** 을 사용한다. ([공식 문서](https://supabase.com/docs/guides/getting-started/mcp))

1. **Cursor** → **Settings** → **Cursor Settings** → **Tools & MCP** (또는 Features → MCP).
2. **supabase** 서버 옆에서 **Connect / Sign in / Authenticate** 류의 버튼이 있으면 클릭.
3. 브라우저가 열리면 Supabase 계정으로 로그인하고, **조직/프로젝트 접근**을 허용한다.

### OAuth URL이 로그에만 나올 때

1. **View** → **Output** (또는 `Cmd+Shift+U`).
2. 드롭다운에서 **MCP** / **MCP Logs** 선택.
3. `authorization` / `https://` 로 시작하는 **auth URL** 이 보이면 전체를 복사해 **브라우저 주소창에 붙여넣기** 후 로그인·승인.
4. 완료 후 Cursor로 돌아와 서버를 **Refresh** 하거나 Cursor를 한 번 재시작.

### 고정 리다이렉트 URI (수동 OAuth 앱을 쓸 때)

Cursor 공식 문서에 따르면 MCP OAuth 콜백은 다음과 같다.

`cursor://anysphere.cursor-mcp/oauth/callback`

Supabase 대시보드에서 OAuth 앱을 만들 때 위 URL을 **허용 리다이렉트**에 넣는다. ([Supabase MCP > Manual OAuth app](https://supabase.com/docs/guides/getting-started/mcp))

---

## 3. Personal Access Token (PAT) — CI / 브라우저 없음 / 클라이언트가 동적 등록 미지원

1. 브라우저에서 [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens) 로 이동.
2. **Generate new token** — 용도 예: `Cursor MCP (local)`.
3. 토큰을 **한 번만** 표시되므로 안전한 곳에 보관 (레포/슬랙에 넣지 말 것).

**로컬 환경 변수** (예: `~/.zshrc`):

```bash
export SUPABASE_ACCESS_TOKEN="여기에_PAT"
export SUPABASE_PROJECT_REF="여기에_project_ref"   # Dashboard URL의 project id
```

**Cursor `mcp.json` 예시 (헤더 인증)** — 프로젝트만 스코프하고 싶으면 쿼리 파라미터 추가:

```json
{
  "mcpServers": {
    "supabase-pat": {
      "url": "https://mcp.supabase.com/mcp?project_ref=${env:SUPABASE_PROJECT_REF}&read_only=true",
      "headers": {
        "Authorization": "Bearer ${env:SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

- `read_only=true` 는 **읽기 전용 Postgres 역할**로 실행 (프로덕션 연결 시 권장).
- **PAT는 Git에 커밋하지 말 것.** `${env:...}` 만 `mcp.json`에 두고 토큰은 환경 변수로만 둔다.

---

## 4. 연결 확인 (Tools & MCP)

1. **Settings → Tools & MCP** 에서 **supabase** 가 **녹색 / Connected** 인지 확인.
2. 도구 개수: Supabase MCP는 기능 그룹(database, docs, edge functions 등)에 따라 **다수의 tool**이 노출된다. Storage 그룹은 기본 **비활성**일 수 있다. ([도구 목록](https://supabase.com/docs/guides/getting-started/mcp#available-tools))
3. 채팅에서 예시:  
   `List tables in my Supabase database using MCP.`  
   `Describe the schema of the Campaign table.`

> 이 저장소의 에이전트 세션에는 MCP 도구가 붙어 있지 않을 수 있어, **스키마 참고는 아래 Prisma/SQL 절**을 사용해도 된다.

---

## 5. `Campaign` 테이블 (MCP로 읽을 때 기대하는 형태)

Prisma 모델 `Campaign` → Postgres 기본 테이블 이름은 **`"Campaign"`** (대문자 C). 스키마는 보통 `public`.

MCP **`execute_sql`** 로 예시:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Campaign'
ORDER BY ordinal_position;
```

앱 소스 기준 컬럼 요약:

| 컬럼 | 타입(개념) |
|------|------------|
| id | uuid, PK |
| userId | uuid, FK → User |
| title | text, nullable |
| status | enum CampaignStatus |
| budget_krw | int |
| duration_weeks | int |
| target_summary | text |
| location_summary | text |
| mediaMix | jsonb |
| omniChannel | boolean |
| omniMediaIds | jsonb, nullable |
| parseSnapshot | jsonb, nullable |
| createdAt, updatedAt | timestamptz |

**빠른 생성 API** (`POST /api/campaign/quick`)는 `mediaMix`를 최소 객체로, 요약 필드는 플레이스홀더 문자열로 채운다.

---

## 6. Phase 3 이어가기 (이 레포에서 한 일)

- **목록/상세**: 계속 **Prisma** + 기존 `/dashboard/campaigns` 페이지.
- **Supabase MCP**: 스키마 확인·마이그레이션·SQL 실험용 (개발 브랜치 권장).
- **새 캠페인**: **빠른 생성**은 `POST /api/campaign/quick` + 대시보드 모달 + Sonner + `revalidatePath` (로케일별 캠페인 페이지).

---

## 7. 문제 해결

| 증상 | 조치 |
|------|------|
| 서버가 회색 / disconnected | Cursor 재시작 → MCP 로그 확인 → OAuth 다시 시도 |
| 도구가 적게 보임 | Storage 등 그룹은 기본 off — Supabase MCP 설정에서 feature 활성화 |
| 테이블이 없음 | `DATABASE_URL`이 Supabase인지 확인 후 `npx prisma migrate deploy` |
| Prompt injection 우려 | 도구 실행 전 Cursor의 **tool 승인** 유지, 프로덕션 DB에는 `read_only=true` 검토 |
