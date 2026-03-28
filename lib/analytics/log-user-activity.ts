import type { UserActivityCategory } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LogUserActivityParams = {
  userId: string;
  action: string;
  category: UserActivityCategory;
  meta?: Record<string, unknown> | null;
};

/**
 * 사용자 활동 로그 (실패 시 무시 — 인증·핵심 플로우를 막지 않음)
 */
export async function logUserActivity(params: LogUserActivityParams): Promise<void> {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId: params.userId,
        action: params.action.slice(0, 200),
        category: params.category,
        meta:
          params.meta === undefined || params.meta === null
            ? undefined
            : (params.meta as Prisma.InputJsonValue),
      },
    });
  } catch {
    /* DB 미설정·스키마 미적용 등 */
  }
}
