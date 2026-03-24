import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function requireAdvertiserSession(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: number; message: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "로그인이 필요합니다." };
  }
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!u) {
    return {
      ok: false,
      status: 404,
      message: "회원 정보를 찾을 수 없습니다.",
    };
  }
  if (u.role !== UserRole.ADVERTISER) {
    return {
      ok: false,
      status: 403,
      message: "광고주 계정만 이용할 수 있습니다.",
    };
  }
  return { ok: true, userId: session.user.id };
}
