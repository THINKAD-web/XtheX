import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";

export async function requireDbUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 404; message: string }
> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { ok: false, status: 401, message: "로그인이 필요합니다." };
  }
  const user = await findUserByClerkId(clerkId);
  if (user) return { ok: true, userId: user.id };
  return {
    ok: false,
    status: 404,
    message:
      "회원 정보를 찾을 수 없습니다. 가입을 완료한 뒤 다시 시도해 주세요.",
  };
}

/**
 * 옴니 카트 → 캠페인 제출 등: DB에 User가 없으면 생성 후 userId 반환.
 */
export async function getOrCreateDbUserForCampaign(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 500; message: string }
> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { ok: false, status: 401, message: "로그인이 필요합니다." };
  }
  const existing = await findUserByClerkId(clerkId);
  if (existing) return { ok: true, userId: existing.id };

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    (clerkUser?.primaryEmailAddress?.emailAddress as string | undefined) ??
    `adv_${clerkId.slice(0, 8)}@xthex.local`;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    null;

  try {
    const created = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        role: UserRole.ADVERTISER,
        onboardingCompleted: true,
      },
    });
    return { ok: true, userId: created.id };
  } catch (e) {
    console.error("[getOrCreateDbUserForCampaign]", e);
    return {
      ok: false,
      status: 500,
      message:
        "회원 정보를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
