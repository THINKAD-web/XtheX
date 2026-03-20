import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import path from "path";

// 서버에서 DATABASE_URL이 비어 있을 때 .env.local 한 번 더 로드 (실행 경로 차이 대비)
if (typeof window === "undefined" && !process.env.DATABASE_URL?.trim()) {
  try {
    const { config } = require("dotenv");
    config({ path: path.join(process.cwd(), ".env.local"), override: true });
  } catch {
    // dotenv 없거나 실패 시 무시
  }
}

declare global {
  // allow global 'prisma' in development to prevent hot reload issues
  // (Next.js 16 + Turbopack + React 19)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL. Add it to .env.local (e.g. Neon: https://neon.tech → Connection string)",
    );
  }

  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 15),
  });

  const devLogs =
    process.env.PRISMA_QUERY_LOG === "1"
      ? (["query", "warn", "error"] as const)
      : (["warn", "error"] as const);

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log:
      process.env.NODE_ENV === "development"
        ? [...devLogs]
        : ["error"],
  });
}

/** Lazy init: throw only when DB is first used, so dev server can start without DATABASE_URL. */
export function getPrisma(): PrismaClient {
  if (globalThis.prisma) return globalThis.prisma;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") globalThis.prisma = client;
  return client;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** DB 사용 전 확인용. false면 prisma 호출하지 말고 설정 안내 UI 표시. */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim();
}

export default prisma;
export { prisma };
