import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

export const runtime = "nodejs";
/** 세션 등이 HTML/캐시로 고정되면 클라이언트가 JSON 대신 <!DOCTYPE 을 받을 수 있음 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
