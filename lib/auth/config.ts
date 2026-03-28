import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAndConsumeBackupCode, verifyTotpToken } from "@/lib/security/two-factor";
import { logUserActivity } from "@/lib/analytics/log-user-activity";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      totpCode: { label: "Authenticator code", type: "text" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      const totpCode =
        typeof credentials?.totpCode === "string" ? credentials.totpCode.trim() : "";
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          password: true,
          role: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          twoFactorBackupCodes: true,
        },
      });
      if (!user?.password) return null;

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return null;

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!totpCode) return null;
        const totpOk = verifyTotpToken(user.twoFactorSecret, totpCode);
        if (!totpOk) {
          const backupOk = await verifyAndConsumeBackupCode(
            user.id,
            totpCode,
            async (next) => {
              await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorBackupCodes: next },
              });
            },
            user.twoFactorBackupCodes,
          );
          if (!backupOk) return null;
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const existing = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { id: true, image: true, name: true },
        });
        if (existing) {
          const updates: Record<string, string> = {};
          if (!existing.image && (user.image || (profile as any).picture))
            updates.image = user.image || (profile as any).picture;
          if (!existing.name && (profile.name || user.name))
            updates.name = (profile.name || user.name)!;
          if (Object.keys(updates).length > 0) {
            await prisma.user.update({ where: { id: existing.id }, data: updates });
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = (user as { role?: UserRole }).role ?? UserRole.ADVERTISER;
        if (user.email) token.email = user.email;
      }
      if (trigger === "update" && session?.user?.name != null) {
        token.name = session.user.name;
      }
      const uid = (token.sub ?? token.id) as string | undefined;
      if (uid) {
        try {
          const row = await prisma.user.findUnique({
            where: { id: uid },
            select: { role: true, email: true },
          });
          if (row) {
            token.role = row.role;
            if (row.email) token.email = row.email;
          }
        } catch {
          // DB 다운·DATABASE_URL 누락 시 JWT 갱신이 500 HTML을 반환해
          // CLIENT_FETCH_ERROR(HTML 파싱 실패)로 이어지므로 기존 토큰 유지
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.role = (token.role as UserRole) ?? UserRole.ADVERTISER;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      const uid =
        typeof message.user?.id === "string" ? message.user.id : undefined;
      if (uid) {
        await logUserActivity({
          userId: uid,
          action: "SESSION_START",
          category: "AUTH",
          meta: {
            provider: message.account?.provider ?? "unknown",
          },
        });
      }
    },
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
