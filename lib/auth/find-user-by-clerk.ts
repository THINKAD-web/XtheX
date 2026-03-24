/**
 * DB에 `onboardingCompleted` 등 스키마 컬럼이 아직 없을 때(P2022)에도
 * 관리자/대시보드가 동작하도록 ClerkId로 User를 조회합니다.
 * 근본 해결: `npx prisma db push` 또는 마이그레이션 적용.
 */
import { Prisma, type UserRole } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

/** DB 연결 실패(ECONNREFUSED 등) 시 throw. 호출처에서 안내 UI 표시용. */
export class DatabaseConnectionError extends Error {
  constructor(message = "Database connection refused") {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

function isConnectionError(e: unknown): boolean {
  const err = e as { message?: string; code?: string; meta?: { message?: string } };
  const msg = [err?.message, err?.meta?.message].filter(Boolean).join(" ");
  if (msg && /ECONNREFUSED|connection refused|Can't reach database/i.test(msg)) return true;
  const code = err?.code;
  return code === "ECONNREFUSED" || code === "P1001";
}

export type UserByClerkRow = {
  id: string;
  clerkId: string | null;
  role: UserRole;
  email: string;
  name: string | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function findUserById(id: string): Promise<UserByClerkRow | null> {
  if (!id?.trim()) return null;
  const prisma = getPrisma();
  try {
    return await prisma.user.findUnique({
      where: { id: id.trim() },
      select: {
        id: true,
        clerkId: true,
        role: true,
        onboardingCompleted: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (e) {
    if (isConnectionError(e)) {
      throw new DatabaseConnectionError();
    }
    throw e;
  }
}

export async function findUserByClerkId(
  clerkId: string,
): Promise<UserByClerkRow | null> {
  if (!clerkId?.trim()) return null;
  const prisma = getPrisma();
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId.trim() },
      select: {
        id: true,
        clerkId: true,
        role: true,
        onboardingCompleted: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch (e) {
    if (isConnectionError(e)) {
      console.warn("[findUserByClerkId] Database connection refused. Start Postgres (docker compose up -d) or set DATABASE_URL to Neon.");
      throw new DatabaseConnectionError();
    }
    const isMissingColumn =
      e instanceof Prisma.PrismaClientKnownRequestError &&
      (e.code === "P2022" ||
        /column.*does not exist|does not exist.*column/i.test(
          e.message ?? "",
        ));
    if (isMissingColumn) {
      try {
        const u = await getPrisma().user.findUnique({
          where: { clerkId: clerkId.trim() },
          select: {
            id: true,
            clerkId: true,
            role: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        if (!u) return null;
        return { ...u, onboardingCompleted: true };
      } catch (inner) {
        if (isConnectionError(inner)) throw new DatabaseConnectionError();
        throw e;
      }
    }
    console.error("[findUserByClerkId]", e);
    throw e;
  }
}
