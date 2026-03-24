import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function requireDbUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 404; message: string }
> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "로그인이 필요합니다." };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (user) return { ok: true, userId: user.id };
  return {
    ok: false,
    status: 404,
    message:
      "회원 정보를 찾을 수 없습니다. 가입을 완료한 뒤 다시 시도해 주세요.",
  };
}

/**
 * 옴니 카트 → 캠페인 제출: 세션의 DB User id만 사용 (자동 생성 없음).
 */
export async function getOrCreateDbUserForCampaign(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 404; message: string }
> {
  return requireDbUser();
}
