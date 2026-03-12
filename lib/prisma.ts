import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7: engineType "client" → 반드시 adapter 또는 accelerateUrl 필요.
// 여기서는 Neon/Postgres TCP용 adapter-pg + pg.Pool 사용.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL for Prisma");
  }

  const pool = new Pool({
    connectionString,
    max: 5,
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ["query"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

